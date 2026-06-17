param(
  [string]$ProjectId = "3112350855526039281"
)

$mcpPath = Join-Path $env:USERPROFILE ".cursor\mcp.json"
$key = (Get-Content $mcpPath | ConvertFrom-Json).mcpServers.stitch.headers.'X-Goog-Api-Key'
$headers = @{ "X-Goog-Api-Key" = $key; "Content-Type" = "application/json" }

$screens = @(
  @{ slug = "login"; id = "4d3aa82624fb452ab0abdf7c8f4b2917"; label = "Screen 1: Login - Human Milk Bank" },
  @{ slug = "donor-registration"; id = "22270b51101a4f32809acaf2df6390e9"; label = "Screen 2: Donor Registration" },
  @{ slug = "milk-donation-log"; id = "4c6c02a7e7f248a98c183e7bbb7e6eae"; label = "Screen 3: Milk Donation Log - Updated Layout" },
  @{ slug = "inventory-lab-results"; id = "33155b4c88794b498d9330602d1fa1bb"; label = "Screen 4: Inventory & Laboratory Results" },
  @{ slug = "data-export"; id = "66f4e526b5984f869d0f21e400bb7912"; label = "Screen 5: Data Export Tool - Updated Layout" },
  @{ slug = "beneficiary-dispensing"; id = "3e0fd6fe85b24f83b8858503eb3df2c4"; label = "Screen 6: Beneficiary Dispensing Record" },
  @{ slug = "beneficiary-registration"; id = "f66c92f022104451a4a664780ee37064"; label = "Screen 7: Beneficiary Registration - Updated Layout" },
  @{ slug = "donor-community-map"; id = "e460db8c4f824fe3968fb7d248405eb5"; label = "Screen 8: Donor Community Map" },
  @{ slug = "donor-directory"; id = "49285143bdf04ed5a3d62c2ccdd6f5b4"; label = "Screen 9: Donor Directory - Mom's Act" },
  @{ slug = "collection-point-logistics"; id = "084f5fe809cb4e43b6e7b9cc1df7ede2"; label = "Screen 10: Collection Point Logistics - Updated Layout" },
  @{ slug = "onsite-collection-terminal"; id = "bf80800763454f6db32cafb33c4fbaac"; label = "Screen 11: Onsite Collection Terminal - Updated Layout" }
)

$designsDir = Join-Path $PSScriptRoot "..\.stitch\designs"
New-Item -ItemType Directory -Force -Path $designsDir | Out-Null

foreach ($screen in $screens) {
  $htmlPath = Join-Path $designsDir "$($screen.slug).html"
  $pngPath = Join-Path $designsDir "$($screen.slug).png"
  if ((Test-Path $htmlPath) -and (Test-Path $pngPath)) {
    Write-Host "Skipping $($screen.slug) (already downloaded)"
    continue
  }

  $body = @{
    jsonrpc = "2.0"
    id = 1
    method = "tools/call"
    params = @{
      name = "get_screen"
      arguments = @{
        projectId = $ProjectId
        screenId = $screen.id
      }
    }
  } | ConvertTo-Json -Depth 5

  $response = Invoke-RestMethod -Uri "https://stitch.googleapis.com/mcp" -Method POST -Headers $headers -Body $body
  $screenData = $response.result.structuredContent

  if (-not $screenData) {
    $text = $response.result.content[0].text
    $screenData = $text | ConvertFrom-Json
  }

  $htmlUrl = $screenData.htmlCode.downloadUrl
  $pngUrl = $screenData.screenshot.downloadUrl
  $width = $screenData.width
  if (-not $width) { $width = 1280 }

  Write-Host "Downloading $($screen.slug)..."
  curl.exe -L -f -sS --connect-timeout 30 --compressed "$htmlUrl" -o "$htmlPath"
  curl.exe -L -f -sS --connect-timeout 30 --compressed "${pngUrl}=w$width" -o "$pngPath"
}

Write-Host "Done."
