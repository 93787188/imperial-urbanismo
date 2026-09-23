Add-Type -AssemblyName System.Drawing
$DIR = "C:\Users\david\Downloads\imperial-empreendimentos\assets\img\home"

$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$ep = New-Object System.Drawing.Imaging.EncoderParameters(1)
$ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]82)

# nome | cropX,cropY,cropW,cropH (fracoes 0-1; $null = imagem inteira) | largura final
$JOBS = @(
  @('hero',            $null,                 1760),
  @('cta-bg',          $null,                 1440),
  @('footer-bg',       $null,                 1600),
  @('card-omni',       @(0,0,1,0.5769),       1100),
  @('card-the-one',    @(0,0,1,0.5769),       1100),
  @('card-interlagos', @(0,0,1,0.5769),       1100),
  @('card-recanto',    @(0,0,1,0.5769),       1100),
  @('traj-col',        @(0,0,1,0.4701),       1100),   # foto de cima  -> traj-a
  @('traj-col',        @(0,0.4918,1,0.5082),  1100)    # foto de baixo -> traj-b
)
$OUTNAMES = @('hero','cta-bg','footer-bg','card-omni','card-the-one','card-interlagos','card-recanto','traj-a','traj-b')

for ($i = 0; $i -lt $JOBS.Count; $i++) {
  $name = $JOBS[$i][0]; $crop = $JOBS[$i][1]; $targetW = $JOBS[$i][2]
  $out  = $OUTNAMES[$i]
  $srcPath = Join-Path $DIR "$name.png"
  if (-not (Test-Path $srcPath)) { Write-Host "SKIP $name"; continue }

  $img = [System.Drawing.Image]::FromFile($srcPath)
  if ($crop) {
    $cx = [int]($img.Width  * $crop[0]); $cy = [int]($img.Height * $crop[1])
    $cw = [int]($img.Width  * $crop[2]); $ch = [int]($img.Height * $crop[3])
  } else {
    $cx = 0; $cy = 0; $cw = $img.Width; $ch = $img.Height
  }
  $scale = [Math]::Min(1.0, $targetW / $cw)
  $nw = [int]($cw * $scale); $nh = [int]($ch * $scale)

  $bmp = New-Object System.Drawing.Bitmap($nw, $nh)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode     = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.PixelOffsetMode   = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $destRect = New-Object System.Drawing.Rectangle(0, 0, $nw, $nh)
  $g.DrawImage($img, $destRect, $cx, $cy, $cw, $ch, [System.Drawing.GraphicsUnit]::Pixel)

  $bmp.Save((Join-Path $DIR "$out.jpg"), $codec, $ep)
  $g.Dispose(); $bmp.Dispose(); $img.Dispose()
  Write-Host "$out.jpg  ${nw}x${nh}"
}

Get-ChildItem -Path $DIR -Filter *.png | Remove-Item -Force
Write-Host "PNGs temporarios removidos."
