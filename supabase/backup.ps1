param(
  [string]$BackupDirectory = (Join-Path $env:LOCALAPPDATA 'AbastoPos\backups')
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$pgDump = Get-Command pg_dump -ErrorAction SilentlyContinue
$pgRestore = Get-Command pg_restore -ErrorAction SilentlyContinue
if (-not $pgDump -or -not $pgRestore) {
  throw 'Instala PostgreSQL Command Line Tools y asegúrate de que pg_dump y pg_restore estén en PATH.'
}

$dbHost = (Read-Host 'Host de la base (Dashboard > Connect; solo hostname)').Trim()
if ([string]::IsNullOrWhiteSpace($dbHost) -or $dbHost -match '[:/\s]') {
  throw 'Host inválido. Introduce solo el hostname, sin protocolo ni puerto.'
}

$portInput = (Read-Host 'Puerto [5432]').Trim()
$port = 5432
if ($portInput -and (-not [int]::TryParse($portInput, [ref]$port) -or $port -lt 1 -or $port -gt 65535)) {
  throw 'Puerto inválido.'
}

$dbName = (Read-Host 'Base de datos [postgres]').Trim()
if (-not $dbName) { $dbName = 'postgres' }
$dbUser = (Read-Host 'Usuario de base de datos [postgres]').Trim()
if (-not $dbUser) { $dbUser = 'postgres' }
$securePassword = Read-Host 'Contraseña de base de datos (no se mostrará)' -AsSecureString

$passwordPointer = [IntPtr]::Zero
$passwordText = $null
$previousPassword = [Environment]::GetEnvironmentVariable('PGPASSWORD', 'Process')
$previousSslMode = [Environment]::GetEnvironmentVariable('PGSSLMODE', 'Process')
$partialPath = $null

try {
  $passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
  $passwordText = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer)
  $env:PGPASSWORD = $passwordText
  $env:PGSSLMODE = 'require'

  New-Item -ItemType Directory -Path $BackupDirectory -Force | Out-Null
  $timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
  $finalPath = Join-Path $BackupDirectory "abasto-pos-$timestamp.dump"
  $partialPath = "$finalPath.partial"

  $dumpArgs = @(
    '--host', $dbHost,
    '--port', "$port",
    '--username', $dbUser,
    '--dbname', $dbName,
    '--format=custom',
    '--no-password',
    "--file=$partialPath"
  )
  & $pgDump.Source @dumpArgs
  if ($LASTEXITCODE -ne 0) {
    throw "pg_dump terminó con código $LASTEXITCODE."
  }

  if (-not (Test-Path -LiteralPath $partialPath) -or (Get-Item -LiteralPath $partialPath).Length -eq 0) {
    throw 'pg_dump no generó un archivo de respaldo válido.'
  }

  & $pgRestore.Source '--list' $partialPath | Out-Null
  if ($LASTEXITCODE -ne 0) {
    throw 'pg_restore no pudo leer el archivo; se descarta el respaldo incompleto.'
  }

  Move-Item -LiteralPath $partialPath -Destination $finalPath
  $partialPath = $null
  $file = Get-Item -LiteralPath $finalPath
  $hash = (Get-FileHash -LiteralPath $finalPath -Algorithm SHA256).Hash
  Write-Output "Respaldo verificado: $($file.FullName)"
  Write-Output "Tamaño: $($file.Length) bytes"
  Write-Output "SHA-256: $hash"
  Write-Warning 'El archivo contiene datos del negocio. Guárdalo cifrado y con acceso restringido; valida una restauración en un proyecto separado.'
}
finally {
  if ($partialPath -and (Test-Path -LiteralPath $partialPath)) {
    Remove-Item -LiteralPath $partialPath -Force
  }
  [Environment]::SetEnvironmentVariable('PGPASSWORD', $previousPassword, 'Process')
  [Environment]::SetEnvironmentVariable('PGSSLMODE', $previousSslMode, 'Process')
  if ($passwordPointer -ne [IntPtr]::Zero) {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer)
  }
  $passwordText = $null
  $securePassword.Dispose()
}
