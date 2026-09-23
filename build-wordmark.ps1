Add-Type -AssemblyName System.Drawing

# O export do Figma vem com fundo opaco #1F1F1F e letras #F6F3E8.
# Extrai o alfa interpolando entre as duas cores, para as letras poderem
# ficar por cima da foto do rodape.
$PATH = "C:\Users\david\Downloads\imperial-empreendimentos\assets\img\home\wordmark.png"

$src = New-Object System.Drawing.Bitmap($PATH)
$w = $src.Width; $h = $src.Height
$rect = New-Object System.Drawing.Rectangle(0, 0, $w, $h)

$data = $src.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadOnly, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$bytes = New-Object byte[] ($data.Stride * $h)
[System.Runtime.InteropServices.Marshal]::Copy($data.Scan0, $bytes, 0, $bytes.Length)
$src.UnlockBits($data)

$BG = 31.0           # fundo #1F1F1F
$FGr = 246; $FGg = 243; $FGb = 232   # letras #F6F3E8
$span = 246.0 - $BG

for ($i = 0; $i -lt $bytes.Length; $i += 4) {
  # ordem BGRA
  $r = $bytes[$i + 2]
  $t = ($r - $BG) / $span
  if ($t -lt 0) { $t = 0 } elseif ($t -gt 1) { $t = 1 }
  $bytes[$i]     = $FGb
  $bytes[$i + 1] = $FGg
  $bytes[$i + 2] = $FGr
  $bytes[$i + 3] = [byte][Math]::Round($t * 255)
}

$out = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$d2 = $out.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::WriteOnly, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
[System.Runtime.InteropServices.Marshal]::Copy($bytes, 0, $d2.Scan0, $bytes.Length)
$out.UnlockBits($d2)

$src.Dispose()
$out.Save($PATH, [System.Drawing.Imaging.ImageFormat]::Png)
$out.Dispose()

# confere
$chk = New-Object System.Drawing.Bitmap($PATH)
"wordmark.png  $($chk.Width)x$($chk.Height)"
foreach ($pt in @(@(5,5), @(100,200), @(60,150))) {
  $c = $chk.GetPixel($pt[0], $pt[1])
  "  ($($pt[0]),$($pt[1]))  R=$($c.R) G=$($c.G) B=$($c.B) A=$($c.A)"
}
$chk.Dispose()
"{0} KB" -f [int]((Get-Item $PATH).Length / 1KB)
