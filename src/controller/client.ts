import {v4 as uuid} from 'uuid'
interface IChunkUploaderOption {
  chunkSize: number //mb base
}
interface IUploadOptions{
  endpoint: string // backend endpoint where to upload the file.
  fileId?: string // id of the file
}
interface ICallback {
  (data: any): void
}
interface IListener {
  onAbort: ICallback
  onError: ICallback
  onProgress: ICallback
  onCompleted: ICallback
}
export default class ChunkUploader {
  private listener:IListener
  constructor () {
  }
  private getChunkSize = (size = 8) => {
    return ((1024 * 1024) * size)
  }
  private uploadFiles = (file, options: Required<IUploadOptions>) => {
    const {
      endpoint,
      fileId
    } = options
    const httpOptions = {
      url: endpoint,
      onAbort: (error) => {
        console.log('@on abort');
        this.listener.onAbort(error)
      },
      onError: (error) => {
        console.log('@on onError');
        this.listener.onError(error)
      },
      onProgress: (progress) => {
        console.log('@on onProgress');
        this.listener.onProgress(progress)
      },
      onComplete: () => {
        console.log('@on onComplete');
        this.listener.onCompleted(true)
      },
    }
  
    const uploadToServer = (file, options) => {
      const request = new XMLHttpRequest()
      const formData = new FormData()
      
      formData.append('blob', file, file.name)
      request.open("POST", options.url, true)
      request.setRequestHeader('X-File-Id', fileId)
  
      request.onload = () => options.onComplete();
  
      request.upload.onprogress = () => options.onProgress();
  
      request.onerror = (e) => options.onError(e);
      
      request.onabort = (e) => options.onAbort(e);
  
      request.ontimeout = (e) => options.onError(e);
      request.send(formData);
    }
    uploadToServer(file, httpOptions)
  }
  public upload = (file: File, options: IUploadOptions & IChunkUploaderOption) => {
    const {
      chunkSize = 8,
      endpoint = '', 
      fileId = uuid()
    } = options
    let blobSize = 0
    while (blobSize < file.size) {
      let blobLength = file.size > (blobSize + this.getChunkSize(chunkSize)) ? (blobSize + this.getChunkSize(chunkSize)) : file.size
      this.uploadFiles(file.slice(blobSize, blobLength), {
        fileId: `${fileId}.${file.name.split('.').pop()}`,
        endpoint
      })
      blobSize = blobLength
    }
  }
  /**
   * 
   * @param state 
   * @param callback 
   */
  public on = (state: "progress" | "error" | "completed" | "abort", callback:ICallback = (data: any) => {}) => {
    switch (state) {
      case "abort":
        this.listener.onAbort = callback
      case "error":
        this.listener.onError = callback
      case "progress":
        this.listener.onProgress = callback
      case "completed":
        this.listener.onCompleted = callback
      default:
        break;
    }
    return
  }
}