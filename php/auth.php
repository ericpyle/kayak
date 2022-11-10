<?php
// FROM https://stackoverflow.com/a/9802854
// Method: POST, PUT, GET etc
// Data: array("param" => "value") ==> index.php?param=value

echo json_encode($_POST);
echo "<br>";
// $grantType = urlencode($_POST["grant_type"]);
// $apikey = urlencode($_POST["apikey"]); 
// $query = "?grant_type={$grantType}&apikey={$apikey}";
$response = CallAPI("POST", "https://iam.cloud.ibm.com/identity/token", $_POST);
echo json_encode($response);

function CallAPI($method, $url, $data = false)
{
    $curl = curl_init();

    switch ($method)
    {
        case "POST":
            curl_setopt($curl, CURLOPT_POST, 1);

            if ($data)
                curl_setopt($curl, CURLOPT_POSTFIELDS, $data);
            break;
        case "PUT":
            curl_setopt($curl, CURLOPT_PUT, 1);
            break;
        default:
            if ($data)
                $url = sprintf("%s?%s", $url, http_build_query($data));
    }

    // Optional Authentication:
    // curl_setopt($curl, CURLOPT_HTTPAUTH, CURLAUTH_BASIC);
    // curl_setopt($curl, CURLOPT_USERPWD, "username:password");

    curl_setopt($curl, CURLOPT_URL, $url);
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);

    $result = curl_exec($curl);

    curl_close($curl);

    return $result;
}
?>