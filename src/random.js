export const int = (min, max) => Math.round(min + (max - min) * Math.random())

export const choice = array => array[Math.round((array.length - 1) * Math.random())]
