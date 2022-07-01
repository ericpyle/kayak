rename kayak-master kayak-master.bak ^
    && curl -o kayak-master.zip https://github.com/ericpyle/kayak/archive/refs/heads/master.zip -O -J -L ^
    && powershell.exe -NoP -NonI -Command "Expand-Archive '.\kayak-master.zip' '.'" ^
    && copy kayak-master.bak\data\outlineslive.json kayak-master\data\outlineslive.json ^
    && cd kayak-master ^
    && rebuild-app-kayak-web.bat