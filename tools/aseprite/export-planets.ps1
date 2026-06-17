$ErrorActionPreference = "Stop"

$asepriteExe = if ($env:ASEPRITE_EXE) { $env:ASEPRITE_EXE } else { "aseprite" }
$scriptPath = Join-Path $PSScriptRoot "clean-planet-background.lua"
$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$rawDir = Join-Path $projectRoot "assets\source\planets\raw"
$generatedDir = Join-Path $projectRoot "assets\generated\planets"

New-Item -ItemType Directory -Force $generatedDir | Out-Null

$exports = @(
  @{ Input = "planet-ore-source.jpg"; Output = "planet-ore.png" },
  @{ Input = "planet-fuel-source.jpg"; Output = "planet-fuel.png" },
  @{ Input = "planet-carbon-source.jpg"; Output = "planet-carbon.png" },
  @{ Input = "planet-food-source.jpg"; Output = "planet-food.png" },
  @{ Input = "planet-trade-source.jpg"; Output = "planet-trade.png" }
)

foreach ($export in $exports) {
  $inputPath = Join-Path $rawDir $export.Input
  $outputPath = Join-Path $generatedDir $export.Output

  & $asepriteExe -b $inputPath --script $scriptPath --save-as $outputPath
}

