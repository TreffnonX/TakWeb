function animate() {
  setTimeout(function () {
    requestAnimationFrame(animate);
  }, 1000 / 30);

  renderer.render(scene, camera);
  controls.update();
}