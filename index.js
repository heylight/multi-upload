import MultiUpload from "./src/main";

let multiUpload = new MultiUpload({
  el: document.querySelector("input[type=file]"),
});

multiUpload.on("change", (file, next) => {
  next(true);
});
multiUpload.on("calcStatus", (status) => {
  console.log(status);
});
