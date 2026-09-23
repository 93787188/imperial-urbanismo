Add-Type -AssemblyName System.Drawing

# Descobre pastas por wildcard para nao depender de acentos (PS 5.1 le .ps1 como ANSI)
$DL   = "C:\Users\david\Downloads"
$SRC  = (Get-ChildItem -Path $DL -Directory | Where-Object { $_.Name -like 'FOTOS P*IMPERIAL URBANISMO' } | Select-Object -First 1).FullName
$OUT  = "C:\Users\david\Downloads\imperial-empreendimentos\assets\img"
$MAX  = 1600
$QUALITY = 80

if (-not $SRC) { Write-Host "FATAL: pasta de fotos nao encontrada"; exit 1 }
Write-Host "SRC = $SRC"
New-Item -ItemType Directory -Force -Path $OUT | Out-Null

$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$encParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$encParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]$QUALITY)

function Slug([string]$s) {
  $s = $s -replace '\.[^.]+$', ''
  $s = $s -replace 'C.pia de ', ''
  $s = $s.Normalize([Text.NormalizationForm]::FormD)
  $sb = New-Object Text.StringBuilder
  foreach ($c in $s.ToCharArray()) {
    if ([Globalization.CharUnicodeInfo]::GetUnicodeCategory($c) -ne [Globalization.UnicodeCategory]::NonSpacingMark) { [void]$sb.Append($c) }
  }
  $s = $sb.ToString().ToLower() -replace '[^a-z0-9]+', '-'
  return $s.Trim('-')
}

function Find-Dir($parent, $pattern) {
  return (Get-ChildItem -Path $parent -Directory -ErrorAction SilentlyContinue | Where-Object { $_.Name -like $pattern } | Select-Object -First 1)
}

$projDirs = @{
  'the-one'    = (Find-Dir $SRC 'IMPULSI THE ONE*')
  'interlagos' = (Find-Dir $SRC 'IMPULSI INTERLAGOS*')
  'omni'       = (Find-Dir $SRC 'OMNI*')
}
foreach ($k in $projDirs.Keys) { Write-Host "$k -> $($projDirs[$k].FullName)" }

# projeto | subpasta (wildcard, '.' = raiz) | categoria | limite
$JOBS = @(
  @('the-one',    '.',                    'fachada',    0),
  @('the-one',    'INTERIORES*',          'interiores', 0),
  @('interlagos', 'Fachada*',             'fachada',    0),
  @('interlagos', 'Interiores*',          'interiores', 0),
  @('interlagos', 'Plantas Humanizadas*', 'plantas',    0),
  @('omni',       'IMAGENS FACHADA*',     'fachada',    0),
  @('omni',       'IMAGENS*COMUM',        'area-comum', 0),
  @('omni',       'IMAGENS APTO*',        'interiores', 0),
  @('omni',       'IMAGENS DE DRONE*',    'drone',      8),
  @('omni',       '02*PLANTAS*',          'plantas',   10)
)

$manifest = [ordered]@{}
$total = 0

foreach ($job in $JOBS) {
  $proj = $job[0]; $sub = $job[1]; $cat = $job[2]; $limit = $job[3]
  $base = $projDirs[$proj]
  if (-not $base) { Write-Host "SKIP projeto $proj"; continue }

  if ($sub -eq '.') { $dir = $base.FullName }
  else {
    $d = Find-Dir $base.FullName $sub
    if (-not $d) { Write-Host "SKIP $proj / $sub"; continue }
    $dir = $d.FullName
  }

  $destDir = Join-Path $OUT "$proj\$cat"
  New-Item -ItemType Directory -Force -Path $destDir | Out-Null

  $files = Get-ChildItem -Path $dir -File | Where-Object { $_.Extension -match '^\.(png|jpg|jpeg)$' -and $_.BaseName -notmatch '\(1\)$' } | Sort-Object Name
  if ($limit -gt 0) { $files = $files | Select-Object -First $limit }

  if (-not $manifest.Contains($proj)) { $manifest[$proj] = [ordered]@{} }
  $list = @()

  foreach ($f in $files) {
    try {
      $img = [System.Drawing.Image]::FromFile($f.FullName)
      $w = $img.Width; $h = $img.Height
      $scale = [Math]::Min(1.0, $MAX / [Math]::Max($w, $h))
      $nw = [int][Math]::Round($w * $scale); $nh = [int][Math]::Round($h * $scale)

      $bmp = New-Object System.Drawing.Bitmap($nw, $nh)
      $g = [System.Drawing.Graphics]::FromImage($bmp)
      $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $g.SmoothingMode     = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
      $g.PixelOffsetMode   = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
      $g.DrawImage($img, 0, 0, $nw, $nh)

      $name = (Slug $f.Name) + '.jpg'
      $bmp.Save((Join-Path $destDir $name), $codec, $encParams)
      $g.Dispose(); $bmp.Dispose(); $img.Dispose()

      $list += [ordered]@{ src = "assets/img/$proj/$cat/$name"; w = $nw; h = $nh; label = $f.BaseName }
      $total++
    } catch {
      Write-Host "ERRO: $($f.Name) -> $($_.Exception.Message)"
    }
  }
  $manifest[$proj][$cat] = $list
  Write-Host "$proj / $cat : $($list.Count) imagens"
}

$manifest | ConvertTo-Json -Depth 8 | Out-File -FilePath (Join-Path $OUT "manifest.json") -Encoding utf8
Write-Host "TOTAL: $total imagens processadas"
