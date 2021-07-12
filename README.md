multi-upload

用于大文件断点续传、分片上传，需要接口配合

```html
<div class="HelloWorld">
  <input type="file" id="myfile" />
</div>
```

```js
import MultiUpload from "./MultiUpload";
export default {
  name: "HelloWorld",
  data() {
    return {};
  },
  methods: {
    init() {
      let multiUpload = new MultiUpload({
        el: "#myfile",
        checkURL: "/api/v1/image_chunk/check_upload",
        uploadURL: "/api/v1/image_chunk/upload",
        mergeURL: "/api/v1/image_chunk/merge",
        maxRequest: 3,
      });
      multiUpload.onupdate((status) => {
        console.log(status);
      });
      multiUpload.onchange((file) => {
        console.log(file);
        return true;
      });
      multiUpload.onprogress((done, total) => {
        console.log(done, total, done / total);
      });
    },
  },
  mounted() {
    this.init();
  },
};
```
