var roads, result, layerBG, flag = false;

$("#document").ready(function () {
    var startPoint = new ol.Feature();
    var destPoint = new ol.Feature();
    var format = "image/png";
    var bounds = [
        105.491539306641, 20.8914451599121, 105.982925415039, 20.986128616333,
    ];
    layerBG = new ol.layer.Tile({
        source: new ol.source.OSM({}),
    });
    roads = new ol.layer.Image({
        source: new ol.source.ImageWMS({
            url: "http://localhost:8080/geoserver/BTL/wms",
            params: {
                FORMAT: format,
                VERSION: "1.1.1",
                STYLES: "",
                LAYERS: "BTL:roads",
            },
        }),
    });
    var layer_ic = new ol.layer.Image({
        className: "point-layer",
        source: new ol.source.ImageWMS({
            ratio: 1,
            url: "http://localhost:8080/geoserver/BTL/wms",
            params: {
                FORMAT: format,
                VERSION: "1.1.1",
                STYLES: "",
                LAYERS: "BTL:bus_station",
            },
        }),
    });
    var projection = new ol.proj.Projection({
        code: "EPSG:4326",
        units: "degrees",
        axisOrientation: "neu",
    });
    var view = new ol.View({
        projection: projection,
    });
    var map = new ol.Map({
        target: "map",
        layers: [layerBG, roads, layer_ic],
        view: view,
    });
    map.getView().fit(bounds, map.getSize());
    var vectorLayer = new ol.layer.Vector({
        source: new ol.source.Vector({
            features: [startPoint, destPoint],
        }),
    });
    map.addLayer(vectorLayer);

    map.on("singleclick", function (evt) {
        if ($("#txtPoint1").val() != "" && $("#txtPoint2").val() != "") {
            return;
        }
        var lonlat = ol.proj.transform(
            evt.coordinate,
            "EPSG:3857",
            "EPSG:3857"
        );
        var lon = lonlat[0];
        var lat = lonlat[1];
        var myPoint = lon + " " + lat;
        $.ajax({
            type: "POST",
            url: "db.php",
            data: { functionname: "getInfoCMRToAjax", paPoint: myPoint },
            success: function (result, status, erro) {
                if (startPoint.getGeometry() == null && result != "null") {
                    startPoint.setGeometry(new ol.geom.Point(evt.coordinate));
                    $("#txtPoint1").val(result);
                    lon = evt.coordinate[0];
                    lat = evt.coordinate[1];
                    $("#location1").text('Kinh độ: ' + lon + ' Vĩ độ: ' + lat);
                } else if (destPoint.getGeometry() == null && result != "null") {
                    destPoint.setGeometry(new ol.geom.Point(evt.coordinate));
                    $("#txtPoint2").val(result);
                    lon = evt.coordinate[0];
                    lat = evt.coordinate[1];
                    $("#location2").text('Kinh độ: ' + lon + ' Vĩ độ: ' + lat);
                }
            },
            error: function (req, status, error) {
                console.log(req);
                alert(req + " " + status + " " + error);
            },
        });
    });
    $("#btnSolve").click(function () {
        if (flag == true) {
            return;
        }
        var startCoord = startPoint.getGeometry().getCoordinates();
        var destCoord = destPoint.getGeometry().getCoordinates();
        var params = {
            LAYERS: "BTL:route",
            FORMAT: "image/png",
        };
        var viewparams = [
            "x1:" + startCoord[0],
            "y1:" + startCoord[1],
            "x2:" + destCoord[0],
            "y2:" + destCoord[1],
        ];
        params.viewparams = viewparams.join(";");
        result = new ol.layer.Image({
            source: new ol.source.ImageWMS({
                url: "http://localhost:8080/geoserver/BTL/wms",
                params: params,
            }),
        });
        let distance = doDaiQuangDuong(startCoord, destCoord);
        console.log(distance);
        $("#distance").val(Math.round(distance));
        map.addLayer(result);
        flag = true;
    });

    $("#btnReset").click(function () {
        flag = false;
        $("#txtPoint1").val("");
        $("#txtPoint2").val("");
        $("#location1").text('');
        $("#location2").text('');
        $("#distance").val("");
        startPoint.setGeometry(null);
        destPoint.setGeometry(null);
        map.removeLayer(result);
    });

});

function doDaiQuangDuong(coord1, coord2) {
    var R = 6371000; // Earth's radius in meters
    var lat1 = coord1[1];
    var lon1 = coord1[0];
    var lat2 = coord2[1];
    var lon2 = coord2[0];

    var dLat = (lat2 - lat1) * Math.PI / 180;
    var dLon = (lon2 - lon1) * Math.PI / 180;

    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    var distance = R * c;
    return distance;
}
