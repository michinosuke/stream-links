import d from './default';

d();

fetch('/data.json')
  .then((res) => res.json())
  .then((json) => {
    for (let c = 1; c <= 5; c += 1) {
      for (let r = 1; r <= 6; r += 1) {
        const grid = document.querySelector(`.grid-${c}-${r}`);
        grid.innerHTML = json[c][r].title;
        grid.setAttribute('href', `https://web.microsoftstream.com/browse?q=%23${json[c][r].number}`);
      }
    }
  })
  .catch((error) => console.error(error));
