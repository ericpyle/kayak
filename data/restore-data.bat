curl --request PUT --url http://127.0.0.1:59840/outlineslive --header "Authorization: Basic YWRtaW46cGFzc3dvcmQ=" && curl --request POST --data-ascii "@outlineslive.json" --url http://127.0.0.1:59840/outlineslive/_bulk_docs --header "Authorization: Basic YWRtaW46cGFzc3dvcmQ=" --header "Content-type: application/json"