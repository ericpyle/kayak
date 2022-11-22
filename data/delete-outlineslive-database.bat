@echo off
setlocal
:PROMPT
SET /P AREYOUSURE=Are you sure (Y/[N])?
IF /I "%AREYOUSURE%" NEQ "Y" GOTO END

echo

curl -X DELETE http://localhost:59840/outlineslive --header "Authorization: Basic YWRtaW46cGFzc3dvcmQ="

:END
endlocal