<template>
  <div class="container">
    <el-card>
      <div slot="header">
        <div>课程：</div>
        <div>阶段：</div>
        <div>课时：</div>
      </div>
      <el-form label-width="40px">
        <el-form-item label="视频">
          <input
            ref="video-file"
            type="file"
          >
        </el-form-item>
        <el-form-item label="封面">
          <input
            ref="image-file"
            type="file"
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            @click="handleUpload"
          >开始上传</el-button>
          <el-button>返回</el-button>
        </el-form-item>
        <el-form-item>
          <p>视频上传中：{{uploadPersent}}%</p>
          <p v-if="isUploadSuccess">视频转码中：{{isTrabscodeSuccess ? '完成': '正在处理, 请稍后'}}</p>
          <!-- <p>视频上传中：{{uploadPersent}}</p> -->
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>
<script lang="ts">
/* eslint-disable */
import Vue from 'vue'
import axios from 'axios'
import {
  aliyunImagUploadAddressAdnAuth,
  aliyunVideoUploadAddressAdnAuth,
  transCodeVideo,
  getAliyunTransCodePercent
} from '@/services/aliyun-oss'

export default Vue.extend({
  data () {
    return {
      uploader: null,
      videoId: null,
      imageUrl: '',
      fileName: '',
      uploadPersent: 0,
      isUploadSuccess: false,
      isTrabscodeSuccess: false
    }
  },
  created () {
    this.initUploader()
  },
  computed: {
    video () {
      return this.$refs['video-file']
    },
    image () {
      return this.$refs['image-file']
    }
  },
  methods: {
    initUploader () {
      this.uploader = new window.AliyunUpload.Vod({
        // 阿里账号ID，必须有值 ，值的来源https://help.aliyun.com/knowledge_detail/37196.html
        userId: 1618139964448548,
        //分片大小默认1 MB，不能小于100 KB
        partSize: 1048576,
        //并行上传分片个数，默认5
        parallel: 5,
        //网络原因失败时，重新上传次数，默认为3
        retryCount: 3,
        //网络原因失败时，重新上传间隔时间，默认为2秒
        retryDuration: 2,
        //是否上报上传日志到视频点播，默认为true
        enableUploadProgress: true,
        //开始上传
        'onUploadstarted': async (uploadInfo: any) => {
          console.log("onUploadStarted:" + JSON.stringify(uploadInfo));
          let uploadAuthInfo = null
          if (uploadInfo.isImage) {
            const {data } = await aliyunImagUploadAddressAdnAuth()
            this.imageUrl = data.data.imageURL
            uploadAuthInfo = data.data
          }else {
            console.log('imageUrl')
            console.log(this.imageUrl)
            
            const {data } = await aliyunVideoUploadAddressAdnAuth({
              fileName: uploadInfo.file.name,
              imageUrl: this.imageUrl
            })
            this.videoId = data.data.videoId
            console.log('videoId')
            console.log(data)
            uploadAuthInfo = data.data
            //从视频点播服务获取的uploadAuth、uploadAddress和videoId，设置到SDK里
          }
          console.log(uploadAuthInfo)
          ;(this.uploader as any).setUploadAuthAndAddress(
            uploadInfo,
            uploadAuthInfo.uploadAuth,
            uploadAuthInfo.uploadAddress,
            this.videoId);
        },
        //文件上传成功
        'onUploadSucceed': function (uploadInfo: any) {
          console.log("onUploadSucceed: " + uploadInfo.file.name + ", endpoint:" + uploadInfo.endpoint + ", bucket:" + uploadInfo.bucket + ", object:" + uploadInfo.object);
        },
        //文件上传失败
        'onUploadFailed': function (uploadInfo: any, code: any, message: any) {
          console.log("onUploadFailed: file:" + uploadInfo.file.name + ",code:" + code + ", message:" + message);
        },
        //文件上传进度，单位：字节
        'onUploadProgress': (uploadInfo: any, totalSize: any, loadedPercent: any) => {
          //   console.log("onUploadProgress:file:" + uploadInfo.file.name + ", fileSize:" + totalSize + ", percent:" + Math.ceil(loadedPercent * 100) + "%");
          if (!uploadInfo.isImage) {
            this.uploadPersent = Math.floor(loadedPercent * 100)  
          }
        },
        //上传凭证超时
        'onUploadTokenExpired': function (uploadInfo: any) {
          console.log("onUploadTokenExpired");
          //实现时，根据uploadInfo.videoId调用刷新视频上传凭证接口重新获取UploadAuth
          //从点播服务刷新的uploadAuth，设置到SDK里

          //uploader.resumeUploadWithAuth(uploadAuth);
        },
        //全部文件上传结束
        'onUploadEnd': async (uploadInfo: any) => {
          console.log("onUploadEnd: uploaded all the files+" + uploadInfo);
          this.isUploadSuccess = true
          const { data } = await transCodeVideo({
            lessonId: this.$route.query.lessonId,
            fileId: this.videoId,
            coverImageUrl: this.imageUrl,
            fileName: (this.video as any).files[0].name
          })
          setInterval(async () => {
            const { data } = await getAliyunTransCodePercent(this.$route.query.lessonId)
            console.log(data.data)
            if (data.data === 100) {
              this.isTrabscodeSuccess = true
              console.log('转码成功')
            }
          }, 3000)
        }
      });
    },
    handleUpload() {
      this.isUploadSuccess = false
      this.isTrabscodeSuccess = false
      this.uploadPersent = 0
      // 获取上传的文件
      const imageFile = (this.image as any).files[0]
      const videoFile: any = (this.video as any).files[0]
      const uploader = (this.uploader as any)

      uploader.addFile(imageFile, null, null, null, '{"Vod": {}}')
      uploader.addFile(videoFile, null, null, null, '{"Vod": {}}')
      // 开始上传
      uploader.startUpload()
    },
  }
})
</script>
