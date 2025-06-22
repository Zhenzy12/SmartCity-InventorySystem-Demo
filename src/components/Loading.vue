<style scoped>
  .container {
    width: 3.25em;
    transform-origin: center;
    animation: rotate4 2s linear infinite;
  }

  .loader {
    fill: none;
    stroke: #106ee8;
    stroke-width: 10;
    stroke-dasharray: 2, 200;
    stroke-dashoffset: 0;
    stroke-linecap: round;
    animation: dash4 1.5s ease-in-out infinite;
  }

  @keyframes rotate4 {
    100% {
      transform: rotate(360deg);
    }
  }

  @keyframes dash4 {
    0% {
      stroke-dasharray: 1, 200;
      stroke-dashoffset: 0;
    }

    50% {
      stroke-dasharray: 90, 200;
      stroke-dashoffset: -35px;
    }

    100% {
      stroke-dashoffset: -125px;
    }
  }
</style>

<template>
  <svg viewBox="25 25 50 50" class="container">
    <circle cx="50" cy="50" r="20" class="loader"></circle>
  </svg>
</template>
