# kayak instructions (On Windows 10/11, 64bit)

## Windows Setup
1. If you haven't already, install Docker Desktop for Windows (https://docs.docker.com/desktop/windows/install/)
2. Download and unzip https://github.com/ericpyle/kayak/archive/refs/heads/master.zip into a `kayak-master` folder
4. Right-click on new `kayak-master` folder and Click `Open in Terminal`, or open cmd.exe and change directory to `kayak-master`
5. Type `docker compose up`
6. Click to open http://127.0.0.1:59840/_utils in browser, and type `admin` for user and `password` for password.
7. Click the setup gear icon ⚙️ in the middle left menu, and then click `CORS`, and `Enable Cors`, and tick the `All Domains` radio button (*).
8. Open `kayak-master` folder in another Terminal
9. Type `cd data` and then type `restore-data.bat` to create the `outlineslive` database and restore the `outlineslive.json`
10. Open http://127.0.0.1:12321/ in browser to launch kayak

## To Backup:
1. Open `kayak-master` folder in a Terminal
2. Type `cd data`
3. If you haven't already, download https://github.com/stedolan/jq/releases/download/jq-1.6/jq-win64.exe and copy it to `jq.exe` in the `kayak-master/data` directory 
4. To backup, (!Warning! This will overwrite the previous backup of `outlineslive.json`, but it will first copy it to `outlineslive.json.bak` and prompt you if it's okay to overwrite that) Type `backup-data.bat` to copy the data to `outlineslive.json`

## To Restore
1. Open `kayak-master` folder in a Terminal
2. Type `cd data`
3. (!Warning! This will delete the database called `outlineslive`, but not the `outlineslive.json` backup file) Type `delete-outlineslive-database.bat` and type `Y` to confirm.
4. Type `restore-data.bat`

## To Re-download and Rebuild Kayak webpage
1. Open `kayak-master` folder in a Terminal (but don't use right-click on a folder in Windows explorer to do that, since that will keep the `kayak-master` folder open in a process)
2. Type `install-kayak-update.bat`. This will copy `update-kayak.bat` in the parent directory and change directory there.
3. Type `install-kayak.bat`
    - This will rename the `kayak-master` directory to `kayak-master.bak` and
    download and unzip the latest `kayak-master.zip` from https://github.com/ericpyle/kayak/archive/refs/heads/master.zip
    and then copy the `data/outlineslive.json` from `kayak-master.bak` and then it changes directory to `kayak-master` to run `rebuild-app-kayak-web.bat` to recreate kayak-web image and server
4. When you are ready, remove the `kayak-master.bak` folder (e.g. `rmdir /S kayak-master.bak`) before running `install-kayak-update.bat` and `update-kayak.bat` again, otherwise the `kayak-master` will not be able to be renamed.
