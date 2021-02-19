
var audioHolder = {};

audioHolder.play = function(name, volume) {
    var old = this[name].volume;
    this[name].volume=volume;
    this[name].play();
    this[name].volume=old;
}

function getSound(propName, fileName)
{
    if (localStorage.getItem(fileName+".mp3") !== null) {
        audioHolder[propName] = new Audio(localStorage.getItem(fileName+".mp3"));
    } else if (localStorage.getItem(fileName+".wav") !== null) {
        audioHolder[propName] = new Audio(localStorage.getItem(fileName+".wav"));
    } else {
        if(fileName=="jump1")
            fileName="sarge/jump1";
        audioHolder[propName] = new Audio('sounds/'+fileName+'.mp3');
    }
}

function initializeAudio() {
    getSound("railgun", "railgf1a");
    getSound("railgun_enemy", "railgf1a");
    getSound("jump", "jump1");
    getSound("jumppad", "jumppad");
    getSound("gib", "gibsplt1");
    getSound("teleport", "telein");
    getSound("powerup", "holdable");
    audioHolder.railgun.volume=0.1;
    audioHolder.railgun_enemy.volume=0.08;
    audioHolder.jump.volume=0.2;
    audioHolder.jumppad.volume=0.5;
    audioHolder.gib.volume=0.3;
    //this.audio.gib.playbackRate=0.8;
    audioHolder.teleport.volume=0.4;
    audioHolder.powerup.volume=0.3;
}

export {audioHolder, initializeAudio};

