# Rename images to follow the required naming conventions

# Pleasant images
$pleasantFiles = Get-ChildItem -Path "public/images/pleasant" -Filter "*.jpg"
for ($i = 0; $i -lt $pleasantFiles.Count; $i++) {
    $newName = "pleasant" + ($i + 1) + ".jpg"
    Write-Host "Renaming $($pleasantFiles[$i].Name) to $newName"
    Rename-Item -Path $pleasantFiles[$i].FullName -NewName $newName -Force
}

# Neutral images
$neutralFiles = Get-ChildItem -Path "public/images/neutral" -Filter "*.jpg"
for ($i = 0; $i -lt $neutralFiles.Count; $i++) {
    $newName = "neutral" + ($i + 1) + ".jpg"
    Write-Host "Renaming $($neutralFiles[$i].Name) to $newName"
    Rename-Item -Path $neutralFiles[$i].FullName -NewName $newName -Force
}

# Unpleasant images
$unpleasantFiles = Get-ChildItem -Path "public/images/unpleasant" -Filter "*.jpg"
for ($i = 0; $i -lt $unpleasantFiles.Count; $i++) {
    $newName = "unpleasant" + ($i + 1) + ".jpg"
    Write-Host "Renaming $($unpleasantFiles[$i].Name) to $newName"
    Rename-Item -Path $unpleasantFiles[$i].FullName -NewName $newName -Force
}

# Pleasant cues
$pleasantCueFiles = Get-ChildItem -Path "public/images/pmcues/pleasantcues" -Filter "*.jpg"
for ($i = 0; $i -lt $pleasantCueFiles.Count; $i++) {
    $newName = "pleasantcue" + ($i + 1) + ".jpg"
    Write-Host "Renaming $($pleasantCueFiles[$i].Name) to $newName"
    Rename-Item -Path $pleasantCueFiles[$i].FullName -NewName $newName -Force
}

# Neutral cues
$neutralCueFiles = Get-ChildItem -Path "public/images/pmcues/neutralcues" -Filter "*.jpg"
for ($i = 0; $i -lt $neutralCueFiles.Count; $i++) {
    $newName = "neutralcue" + ($i + 1) + ".jpg"
    Write-Host "Renaming $($neutralCueFiles[$i].Name) to $newName"
    Rename-Item -Path $neutralCueFiles[$i].FullName -NewName $newName -Force
}

# Unpleasant cues
$unpleasantCueFiles = Get-ChildItem -Path "public/images/pmcues/unpleasantcues" -Filter "*.jpg"
for ($i = 0; $i -lt $unpleasantCueFiles.Count; $i++) {
    $newName = "unpleasantcue" + ($i + 1) + ".jpg"
    Write-Host "Renaming $($unpleasantCueFiles[$i].Name) to $newName"
    Rename-Item -Path $unpleasantCueFiles[$i].FullName -NewName $newName -Force
}

Write-Host "All images have been renamed successfully!" 