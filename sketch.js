let video;

function setup() {
  createCanvas(900, 550);
  
  
  let constraints = {
    video: {
      facingMode: 'user' 
    },
    audio: false
  };
  
  
  video = createCapture(constraints);
  video.size(900, 550);
  video.hide(); 
}

function draw() {
  background(220);
  
  
  image(video, 0, 0, width, height);
}

