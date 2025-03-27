let capture;
let posenet;
let singlePose, skeleton;
let actor_img, specs, smoke;

function setup() {
  createCanvas(800, 500);
  capture = createCapture(VIDEO);
  capture.hide();

  posenet = ml5.poseNet(capture, modelLoaded);
  posenet.on('pose', receivedPoses);

  actor_img = loadImage('images/shahrukh.png');
  specs = loadImage('images/spects.png');
  smoke = loadImage('images/cigar.png');
}

function receivedPoses(poses) {
  if (poses.length > 0) {
    singlePose = poses[0].pose;
    skeleton = poses[0].skeleton;
  }
}

function modelLoaded() {
  console.log('Model has loaded');
}

function draw() {
  image(capture, 0, 0);
  fill(255, 0, 0);

  if (singlePose) {
    // Draw keypoints
    for (let i = 0; i < singlePose.keypoints.length; i++) {
      ellipse(singlePose.keypoints[i].position.x, singlePose.keypoints[i].position.y, 20);
    }
    // Draw skeleton
    stroke(255, 255, 255);
    strokeWeight(5);
    for (let j = 0; j < skeleton.length; j++) {
      line(skeleton[j][0].position.x, skeleton[j][0].position.y,
           skeleton[j][1].position.x, skeleton[j][1].position.y);
    }

    // Retrieve the left and right eye keypoints
    let leftEye = singlePose.keypoints.find(k => k.part === 'leftEye');
    let rightEye = singlePose.keypoints.find(k => k.part === 'rightEye');

    if (leftEye && rightEye) {
      // Run the genetic algorithm to optimize overlay parameters
      let bestParams = optimizeSpecsParameters(leftEye.position, rightEye.position);
      // Draw the specs image using the optimized parameters
      image(specs, bestParams.tx, bestParams.ty, bestParams.width, bestParams.height);
    }
  }
}

// A simple genetic algorithm to optimize overlay parameters for the specs image.
// The genome consists of { tx, ty, width, height }.
// The fitness function computes how closely the predicted eye positions (assuming the specs' eyes
// are at 25% and 75% of its width and 40% of its height) match the detected eye positions.
function optimizeSpecsParameters(leftEyePos, rightEyePos) {
  let popSize = 10;
  let generations = 5;
  let population = [];

  // Initialize population with random candidates
  for (let i = 0; i < popSize; i++) {
    population.push({
      tx: leftEyePos.x - random(30, 60),
      ty: leftEyePos.y - random(20, 40),
      width: random(60, 100),
      height: random(20, 50)
    });
  }

  // Fitness function: lower error (sum of distances) is better.
  // We return negative error so that a higher (less negative) fitness is better.
  function fitness(ind) {
    // Predicted positions on the specs image where the eyes should be:
    let predLeft = { x: ind.tx + 0.25 * ind.width, y: ind.ty + 0.4 * ind.height };
    let predRight = { x: ind.tx + 0.75 * ind.width, y: ind.ty + 0.4 * ind.height };
    let d1 = dist(predLeft.x, predLeft.y, leftEyePos.x, leftEyePos.y);
    let d2 = dist(predRight.x, predRight.y, rightEyePos.x, rightEyePos.y);
    return -(d1 + d2);
  }

  // Run the GA for a fixed number of generations
  for (let gen = 0; gen < generations; gen++) {
    // Evaluate fitness for each individual
    population.forEach(ind => {
      ind.fitness = fitness(ind);
    });
    // Sort the population by fitness (higher is better)
    population.sort((a, b) => b.fitness - a.fitness);

    // Elitism: carry over the top 2 individuals
    let newPopulation = [population[0], population[1]];

    // Fill the rest of the population with offspring
    while (newPopulation.length < popSize) {
      // Randomly select two parents from the top half of the population
      let parents = random(population.slice(0, Math.floor(popSize / 2)), 2);
      let parent1 = parents[0];
      let parent2 = parents[1];

      // Crossover: average the parameters of the parents
      let child = {
        tx: (parent1.tx + parent2.tx) / 2,
        ty: (parent1.ty + parent2.ty) / 2,
        width: (parent1.width + parent2.width) / 2,
        height: (parent1.height + parent2.height) / 2
      };

      // Mutation: add a small random perturbation to each gene
      child.tx += random(-5, 5);
      child.ty += random(-5, 5);
      child.width += random(-5, 5);
      child.height += random(-2, 2);

      newPopulation.push(child);
    }
    population = newPopulation;
  }
  // Return the best candidate from the final population
  population.sort((a, b) => b.fitness - a.fitness);
  return population[0];
}

