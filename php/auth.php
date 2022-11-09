<?php
// FROM https://stackoverflow.com/a/9802854
// Method: POST, PUT, GET etc
// Data: array("param" => "value") ==> index.php?param=value

$parts = parse_url("//{$_SERVER['HTTP_HOST']}{$_SERVER['REQUEST_URI']}");
parse_str($parts['query'], $query);
echo json_encode($query);
echo "<br>";

$response = CallAPI("GET", "https://jsonplaceholder.typicode.com/todos/1/", $query);
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
    curl_setopt($curl, CURLOPT_HTTPAUTH, CURLAUTH_BASIC);
    curl_setopt($curl, CURLOPT_USERPWD, "username:password");

    curl_setopt($curl, CURLOPT_URL, $url);
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);

    $result = curl_exec($curl);

    curl_close($curl);

    return $result;
}
?>