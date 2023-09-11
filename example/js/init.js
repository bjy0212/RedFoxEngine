let game;
const gamespeed = 10, fps = 60;

function JoinPath(root, srcs) {
    return srcs.map(e => root + e);
}

(function () {
    ChangeResolution(1980, 1080);
    Resize(16, 9);

    // 반드시 클래스 부터 로드 하기
    let list = ["resources/scripts/scenes/test.js"]; //'js/scenes/test.js'

    game = new Game(null, gamespeed, fps);

    LoadScripts(list).then(e => {
        console.log("loaded");
    }).catch(e => {
        console.error(e);
    });
})();
