const audio = {
    railgun: new Audio('sounds/railgf1a.wav'),
    jump: new Audio('sounds/sarge/jump1.wav'),
    jumppad: new Audio('sounds/jumppad.wav'),
    gib: new Audio('sounds/gibsplt1.wav')
}

audio.railgun.volume=0.1;
audio.jump.volume=0.2;
audio.jumppad.volume=0.5;
audio.gib.volume=0.3;

export default audio;

