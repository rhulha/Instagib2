
var audioHolder = {};

audioHolder.play = function(name, volume) {
    volume = volume || this[name].defaultVolume;
    this[name].volume=volume*this.volume;
    this[name].play();
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
    audioHolder.railgun.defaultVolume=0.1;
    audioHolder.railgun_enemy.defaultVolume=0.08;
    audioHolder.jump.defaultVolume=0.2;
    audioHolder.jumppad.defaultVolume=0.5;
    audioHolder.gib.defaultVolume=0.3;
    //this.audio.gib.playbackRate=0.8;
    audioHolder.teleport.defaultVolume=0.4;
    audioHolder.powerup.defaultVolume=0.3;
    audioHolder.volume = 0.1;
}

export {audioHolder, initializeAudio};

