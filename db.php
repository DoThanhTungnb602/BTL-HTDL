<?php
if (isset($_POST['functionname'])) {
    $paPDO = initDB();
    $paSRID = '4326';
    $paPoint = $_POST['paPoint'];
    $functionname = $_POST['functionname'];

    $aResult = "null";
    if ($functionname == 'getGeoCMRToAjax')
        $aResult = getGeoCMRToAjax($paPDO, $paSRID, $paPoint);
    else if ($functionname == 'getInfoCMRToAjax')
        $aResult = getInfoCMRToAjax($paPDO, $paSRID, $paPoint);

    echo $aResult;

    closeDB($paPDO);
}

function initDB()
{
    // Kết nối CSDL
    $paPDO = new PDO('pgsql:host=localhost;dbname=test;port=5432', 'postgres', 'Tung2001');
    return $paPDO;
}
function query($paPDO, $paSQLStr)
{
    try {
        // Khai báo exception
        $paPDO->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        // Sử đụng Prepare 
        $stmt = $paPDO->prepare($paSQLStr);
        // Thực thi câu truy vấn
        $stmt->execute();

        // Khai báo fetch kiểu mảng kết hợp
        $stmt->setFetchMode(PDO::FETCH_ASSOC);

        // Lấy danh sách kết quả
        $paResult = $stmt->fetchAll();
        return $paResult;
    } catch (PDOException $e) {
        echo "Thất bại, Lỗi: " . $e->getMessage();
        return null;
    }
}
function closeDB($paPDO)
{
    // Ngắt kết nối
    $paPDO = null;
}

function getResult($paPDO, $paSRID, $paPoint)
{
    $paPoint = str_replace(',', ' ', $paPoint);
    $mySQLStr = "SELECT ST_AsGeoJson(geom) as geo from \"cmr_adm1\" where ST_Within('SRID=" . $paSRID . ";" . $paPoint . "'::geometry,geom)";
    $result = query($paPDO, $mySQLStr);
    if ($result != null) {
        foreach ($result as $item) {
            return $item['geo'];
        }
    } else
        return "null";
}
function getGeoCMRToAjax($paPDO, $paSRID, $paPoint)
{
    $paPoint = str_replace(',', ' ', $paPoint);
    $mySQLStr = "SELECT ST_AsGeoJson(geom) as geo from \"cmr_adm1\" where ST_Within('SRID=" . $paSRID . ";" . $paPoint . "'::geometry,geom)";
    $result = query($paPDO, $mySQLStr);
    if ($result != null) {
        foreach ($result as $item) {
            return $item['geo'];
        }
    } else
        return "null";
}
function getInfoCMRToAjax($paPDO, $paSRID, $paPoint)
{
    $paPoint = str_replace(',', ' ', $paPoint);
    $Point = explode(" ", $paPoint);
    $mySQLStr = "SELECT gid, name from bus_station where SQRT(POW(69.1 * (" . $Point[0] . "::float -  ST_X (ST_Transform (geom, 4326))::float), 2) + 
        POW(69.1 * (ST_Y (ST_Transform (geom, 4326))::float - " . $Point[1] . "::float) * COS(" . $Point[0] . "::float / 57.3), 2)) < 0.005";
    $result = query($paPDO, $mySQLStr);
    if ($result != null) {
        $resFin = '';
        foreach ($result as $item) {
            $resFin = $resFin . $item['name'];
            break;
        }
        return $resFin;
    } else
        return "null";
}
