import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";

function convertToCSV(array: any[]) {
  if (!array || array.length === 0) return "";
  const keys = Object.keys(array[0]);
  const csvRows = [];

  // header row
  csvRows.push(keys.join(","));

  // data rows
  for (const row of array) {
    const values = keys.map((key) => {
      const val = row[key];
      const valStr = val === null || val === undefined ? "" : String(val);
      // Escape double quotes
      const escaped = valStr.replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(","));
  }

  return csvRows.join("\n");
}

export async function POST(request: Request) {
  try {
    const { jobId, dataset, format } = await request.json();

    if (!jobId || !dataset || !format) {
      return NextResponse.json(
        { error: "Missing required fields: jobId, dataset, format" },
        { status: 400 }
      );
    }

    // Determine target database table
    let tableName = "";
    if (dataset === "inventory") {
      tableName = "inventory_batches";
    } else if (dataset === "donors") {
      tableName = "donor_profiles";
    } else if (dataset === "dispensing") {
      tableName = "dispensing_records";
    } else {
      return NextResponse.json({ error: `Invalid dataset: ${dataset}` }, { status: 400 });
    }

    // Fetch data from database
    const { data: records, error: fetchError } = await supabase
      .from(tableName)
      .select("*");

    if (fetchError) {
      console.error(`Failed to fetch data for table ${tableName}:`, fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    const rowCount = records ? records.length : 0;
    const extension = format.toLowerCase();
    const fileName = `${jobId}.${extension}`;
    const publicDirPath = path.join(process.cwd(), "public", "exports");
    const filePath = path.join(publicDirPath, fileName);

    // Ensure directory exists
    if (!fs.existsSync(publicDirPath)) {
      fs.mkdirSync(publicDirPath, { recursive: true });
    }

    // Format & Write file
    if (format === "JSON") {
      const content = JSON.stringify(records || [], null, 2);
      fs.writeFileSync(filePath, content, "utf-8");
    } else if (format === "CSV") {
      const content = convertToCSV(records || []);
      fs.writeFileSync(filePath, content, "utf-8");
    } else if (format === "XLSX") {
      const worksheet = XLSX.utils.json_to_sheet(records || []);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
      fs.writeFileSync(filePath, buffer);
    } else {
      return NextResponse.json({ error: `Unsupported format: ${format}` }, { status: 400 });
    }

    // Update job status in database
    const { error: updateError } = await supabase
      .from("export_jobs")
      .update({
        status: "verified",
        status_label: "Complete",
        row_count: rowCount,
        completed_at: new Date().toISOString(),
        file_url: `/exports/${fileName}`,
      })
      .eq("id", jobId);

    if (updateError) {
      console.error("Failed to update export job status:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      fileUrl: `/exports/${fileName}`,
      rowCount,
    });
  } catch (error: any) {
    console.error("Error in POST /api/export:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { jobId, fileUrl } = await request.json();

    if (!jobId) {
      return NextResponse.json({ error: "Missing jobId" }, { status: 400 });
    }

    // Delete the file from local public/exports if it exists
    if (fileUrl && fileUrl.startsWith("/exports/")) {
      const fileName = fileUrl.replace("/exports/", "");
      const filePath = path.join(process.cwd(), "public", "exports", fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Delete the job from database
    const { error: dbError } = await supabase
      .from("export_jobs")
      .delete()
      .eq("id", jobId);

    if (dbError) {
      console.error(`Failed to delete job ${jobId} from DB:`, dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in DELETE /api/export:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
