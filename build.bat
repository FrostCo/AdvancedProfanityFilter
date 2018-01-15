set bin=%SyncHome%\Apps\File\7-Zip\7za.exe
%bin% u -tzip .\extension.zip -aoa -ir!eventPage.js filter.js icons/* manifest.json options.* -xr!.git
