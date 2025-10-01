# PowerShell script to convert CommonJS to ES modules
# Run this from the backend directory

Write-Host "Converting CommonJS to ES modules..." -ForegroundColor Green

# Convert Routes files
Get-ChildItem -Path "Routes" -Filter "*.js" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    
    # Replace require statements with import
    $content = $content -replace 'const express = require\(''express''\);', 'import express from ''express'';'
    $content = $content -replace 'const router = express\.Router\(\);', 'const router = express.Router();'
    $content = $content -replace 'const (\w+) = require\(''([^'']+)''\);', 'import $1 from ''$2.js'';'
    $content = $content -replace 'module\.exports = router;', 'export default router;'
    
    Set-Content $_.FullName $content
    Write-Host "Converted: $($_.Name)" -ForegroundColor Yellow
}

# Convert controllers files
Get-ChildItem -Path "controllers" -Filter "*.js" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    
    # Replace require statements with import
    $content = $content -replace 'const (\w+) = require\(''([^'']+)''\);', 'import $1 from ''$2.js'';'
    $content = $content -replace 'module\.exports = (\w+);', 'export default $1;'
    
    Set-Content $_.FullName $content
    Write-Host "Converted: $($_.Name)" -ForegroundColor Yellow
}

# Convert services files
Get-ChildItem -Path "services" -Filter "*.js" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    
    # Replace require statements with import
    $content = $content -replace 'const (\w+) = require\(''([^'']+)''\);', 'import $1 from ''$2.js'';'
    $content = $content -replace 'module\.exports = (\w+);', 'export default $1;'
    
    Set-Content $_.FullName $content
    Write-Host "Converted: $($_.Name)" -ForegroundColor Yellow
}

# Convert utils files
Get-ChildItem -Path "utils" -Filter "*.js" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    
    # Replace require statements with import
    $content = $content -replace 'const (\w+) = require\(''([^'']+)''\);', 'import $1 from ''$2.js'';'
    $content = $content -replace 'module\.exports = (\w+);', 'export default $1;'
    
    Set-Content $_.FullName $content
    Write-Host "Converted: $($_.Name)" -ForegroundColor Yellow
}

# Convert validators files
Get-ChildItem -Path "validators" -Filter "*.js" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    
    # Replace require statements with import
    $content = $content -replace 'const (\w+) = require\(''([^'']+)''\);', 'import $1 from ''$2.js'';'
    $content = $content -replace 'module\.exports = (\w+);', 'export default $1;'
    
    Set-Content $_.FullName $content
    Write-Host "Converted: $($_.Name)" -ForegroundColor Yellow
}

Write-Host "Conversion complete!" -ForegroundColor Green
