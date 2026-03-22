window.addEventListener("load", () => {
  document.querySelector(".hero-text").classList.add("show");
});

const canvas = document.getElementById("crowdCanvas");
const ctx = canvas.getContext("2d");

const CONFIG = {
  src: "./assets/images/all-peeps.png",
  rows: 15,
  cols: 7,
};
const randomRange = (min, max) => min + Math.random() * (max - min);
const randomIndex = (arr) => (Math.random() * arr.length) | 0;
const getRandom = (arr) => arr[randomIndex(arr)];
const removeRandom = (arr) => arr.splice(randomIndex(arr), 1)[0];

const img = new Image();
const stage = { width: 0, height: 0 };

const allPeeps = [];
const availablePeeps = [];
const crowd = [];

function createPeep(image, rect) {
  return {
    image,
    rect,
    width: rect[2],
    height: rect[3],
    x: 0,
    y: 0,
    scaleX: 1,
    anchorY: 0,
    walk: null,

    render(ctx) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.scale(this.scaleX, 1);

      ctx.drawImage(
        this.image,
        this.rect[0],
        this.rect[1],
        this.rect[2],
        this.rect[3],
        0,
        0,
        this.width,
        this.height,
      );

      ctx.restore();
    },
  };
}

function createPeeps() {
  const { rows, cols } = CONFIG;

  const w = img.naturalWidth / rows;
  const h = img.naturalHeight / cols;

  for (let i = 0; i < rows * cols; i++) {
    allPeeps.push(
      createPeep(img, [(i % rows) * w, Math.floor(i / rows) * h, w, h]),
    );
  }
}

function resetPeep(peep) {
  const direction = Math.random() > 0.5 ? 1 : -1;

  const startY =
    stage.height -
    peep.height +
    (100 - 250 * gsap.parseEase("power2.in")(Math.random()));

  let startX, endX;

  if (direction === 1) {
    startX = -peep.width;
    endX = stage.width;
    peep.scaleX = 1;
  } else {
    startX = stage.width + peep.width;
    endX = 0;
    peep.scaleX = -1;
  }

  peep.x = startX;
  peep.y = startY;
  peep.anchorY = startY;

  return { startX, startY, endX };
}

function normalWalk(peep, props) {
  const tl = gsap.timeline();

  const xDuration = randomRange(8, 14);

  tl.to(peep, {
    duration: xDuration,
    x: props.endX,
    ease: "none",
  });

  tl.to(
    peep,
    {
      duration: 0.25,
      repeat: xDuration / 0.25,
      yoyo: true,
      y: props.startY - 10,
    },
    0,
  );

  return tl;
}

function addPeep() {
  if (!availablePeeps.length) return;

  const peep = removeRandom(availablePeeps);

  const walk = normalWalk(peep, resetPeep(peep));

  walk.eventCallback("onComplete", () => {
    crowd.splice(crowd.indexOf(peep), 1);
    availablePeeps.push(peep);
    addPeep();
  });

  peep.walk = walk;
  crowd.push(peep);

  crowd.sort((a, b) => a.anchorY - b.anchorY);
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.scale(devicePixelRatio, devicePixelRatio);

  crowd.forEach((p) => p.render(ctx));

  ctx.restore();
}

function resize() {
  stage.width = canvas.clientWidth;
  stage.height = canvas.clientHeight;

  canvas.width = stage.width * devicePixelRatio;
  canvas.height = stage.height * devicePixelRatio;

  crowd.forEach((p) => p.walk && p.walk.kill());

  crowd.length = 0;
  availablePeeps.length = 0;
  availablePeeps.push(...allPeeps);

  const density = Math.floor(stage.width / 50);
  for (let i = 0; i < density; i++) addPeep();
}

function init() {
  createPeeps();
  resize();
  gsap.ticker.add(render);
}

img.onload = init;
img.src = CONFIG.src;

window.addEventListener("resize", resize);
