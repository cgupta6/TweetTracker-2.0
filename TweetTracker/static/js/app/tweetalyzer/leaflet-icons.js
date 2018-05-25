// All icons should have the same base properities
var BaseIcon = L.Icon.extend({
    options: {
        iconSize:     [32, 32],
        shadowSize:   [32, 32],
        iconAnchor:   [32, 32],
        shadowAnchor: [32, 32],
        popupAnchor:  [-16, -32]
    }
});

var hospitalIcon = new BaseIcon({iconUrl: '/static/images/hdx_icons/health_icon.png'});

//icon size is set to yikyak marker size, anchor size is calibrated so clicking on the map will result in marker right on the point
var yakIcon = L.Icon.extend({
    options: {
        iconSize:     [25, 42],
        iconAnchor:   [12, 42],
       }
});

var yikyakIcon = new yakIcon({iconUrl: '/static/images/hdx_icons/yikyak-icon.png'});
// TODO: Add more icons here. Airplanes would probably be another good one. Airstrips too? Limitless possibilities


