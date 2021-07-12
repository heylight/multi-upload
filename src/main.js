import SparkMD5 from "spark-md5";
import axios from "axios";

class MultiUpload {
  constructor(params) {
    this.el = document.querySelector("input[type=file]");
    this.checkURL = "";
    this.uploadURL = "";
    this.mergeURL = "";
    this.md5 = "";
    this.chunks = [];
    this.maxRequest = 6;
    this.filename = "";
    Object.assign(this, params);
    if (typeof this.el === "string") {
      this.el = document.querySelector(this.el);
    }
    this.updateFn = () => {};
    this.el.addEventListener("change", this.changeFile.bind(this));
  }
  onupdate(cb) {
    this.updateFn = cb.bind(this);
  }
  onchange(cb) {
    this.changeFn = cb.bind(this);
  }
  onprogress(cb) {
    this.progressFn = cb.bind(this);
  }
  changeFile(ev) {
    if (ev.target.files.length === 1) {
      const file = ev.target.files[0];
      if (this.changeFn(file)) {
        this.chunks = [];
        this.calcMD5(file).then((md5) => {
          this.md5 = md5;
          this.getServerFileInfo(file, md5);
        });
      } else {
        console.log("abort");
      }
    } else {
      this.emit("error", "只能上传一个文件");
      this.el.file.value = "";
    }
  }
  calcMD5(blob) {
    const result = new Promise((resolve, reject) => {
      const spark = new SparkMD5.ArrayBuffer();
      const fileReader = new FileReader();
      fileReader.onload = (e) => {
        spark.append(e.target.result);
        resolve(spark.end());
      };
      fileReader.onerror = () => {
        reject(new Error("md5 error"));
      };
      fileReader.readAsArrayBuffer(Blob.prototype.slice.call(blob, 0, blob.size));
    });
    return result;
  }
  getServerFileInfo(file, md5) {
    axios.post(this.checkURL + "?identifier=" + md5).then((res) => {
      if (res.data?.code === 1) {
        const { uploadedChunk, chunkSize } = res.data.data; // 已上传的代码块列表
        const total = Math.ceil(file.size / chunkSize); // 总个数
        this.chunkSize = chunkSize; // 标准文件块大小
        for (let i = 0; i < total; i++) {
          const size = i + 1 === total ? file.size % chunkSize : chunkSize;
          const chunk = Blob.prototype.slice.call(file, i * chunkSize, i * chunkSize + size);
          this.chunks.push({
            index: i, // 索引
            isDone: uploadedChunk.includes(i) ? 2 : 0, // 上传进度
            chunk, // blob
            size, // chunk 字节大小
          });
        }
        this.upload();
      }
    });
  }
  upload() {
    const current = this.chunks.find((x) => x.isDone === 0); // 列表中第一个未上传的chunk
    const requestings = this.chunks.filter((x) => x.isDone === 1); // 正在上传的chunk
    const uploadChunks = this.chunks.filter((x) => x.isDone === 2); // 已上传的chunk
    if (requestings.length >= this.maxRequest) return;
    this.progressFn(uploadChunks.length, this.chunks.length);
    if (current && uploadChunks.length < this.chunks.length) {
      current.isDone = 1;
      this.upload();
      let formdata = new FormData();
      formdata.append("chunk", current.index);
      formdata.append("identifier", this.md5);
      formdata.append("file", current.chunk);
      axios
        .post(this.uploadURL, formdata, {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        })
        .then((res) => {
          if (res.data?.code === 1) {
            current.isDone = res.data.data.uploaded ? 2 : 0;
          } else {
            current.isDone = 0;
          }
          this.upload();
        })
        .catch(() => {
          current.isDone = 0;
          this.upload();
        });
    }
    if (uploadChunks.length === this.chunks.length) this.mergeFile();
  }
  mergeFile() {
    axios
      .post(this.mergeURL, {
        identifier: this.md5,
        fileName: this.filename,
      })
      .then((res) => {
        if (res.data?.code === 1) {
          console.log("done");
        }
      });
  }
}
export default MultiUpload;
