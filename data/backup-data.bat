@echo off
setlocal
:PROMPT
SET /P AREYOUSURE=Are you sure (Y/[N])?
IF /I "%AREYOUSURE%" NEQ "Y" GOTO END

@echo on
COPY outlineslive.json outlineslive.json.bak
REM See https://stackoverflow.com/a/37294271
curl -X GET http://localhost:59840/outlineslive/_all_docs?include_docs=true --header "Authorization: Basic YWRtaW46cGFzc3dvcmQ=" | jq "{"""docs""": [.rows[].doc]}" | jq "del(.docs[]._rev)" > outlineslive.json


:END
endlocal