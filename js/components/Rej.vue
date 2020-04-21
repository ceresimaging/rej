<template>
  <v-app
    dark
    class="registration-task"
  >
    <link href="//fonts.googleapis.com/css?family=Roboto:100,300,400,500,700,900" rel="stylesheet">
    <link href="//fonts.googleapis.com/css?family=Material+Icons" rel="stylesheet">
    <link href="//cdn.jsdelivr.net/npm/@mdi/font@3.x/css/materialdesignicons.min.css" rel="stylesheet">

    <v-content class="pa-0 ma-0 fill-height">
      <v-row class="align-top fill-height d-flex flex-nowrap" justify="center">
        <v-col class="pa-0 fill-height" style="position: relative">
          <ImagePane
            :image="imageryImage"
            :pointColor="imageryPointColor"
            @points-changed="imageryPoints = $event"
          />
        </v-col>
        <v-col class="pa-0 fill-height" style="position: relative">
          <ImagePane
            :image="referenceImage"
            :warpedImage="warpedImage"
            :showWarpedImage="showWarpedImage"
            :pointColor="referencePointColor"
            @points-changed="referencePoints = $event" 
          />
        </v-col>
      </v-row>
      
      <v-card class="point-list" ripple elevation="2">
        <v-card-text>
          <PointList 
            v-if="points.length > 0" 
            :showPredictBtns="false && canWarp"
            :points="points" 
            @predict-point="predictPoint"
            @delete-point-pair="deletePointPair"
            :referencePointColor="referencePointColor" 
            :imageryPointColor="imageryPointColor"
          />
          <div v-else style="font-style: italic; color: #aaa; max-width: 15em;">
            Click matching features on the left and right to georeference right image.
          </div>
        </v-card-text>
      </v-card>

      <div style="position: absolute; right: 10px; bottom: 0px">
        <div v-if="numImagesLoading > 0">
          <label>Downloading Image(s)...</label>
          <v-progress-linear indeterminate/>
        </div>
        <v-card-actions v-else >
          <v-btn
            :color="warpedImage ? 'secondary' : 'primary'"
            @click="warp"
            :disabled="!canWarp"
            :loading="warping"
            :text="Boolean(warpedImage)"
          >
            Warp (w)
          </v-btn>
          <v-btn
            color="primary"
            @click="savePTS"
            :disabled="points.length <= 3"
            v-if="warpedImage"
          >
            Save (s)
          </v-btn>
        </v-card-actions>
      </div>



      <div v-if="warpedImage">
        <div class="extra-options-box">
          <v-checkbox @change="numToggles += 1" v-model="showWarpedImage" title="Try [spacebar] to toggle" label="Overlay Warp" />
          <!--<v-checkbox :disabled="points.length < 4" v-model="autoWarp" title="Warp when points change" label="Auto-warp"/>-->
        </div>
      </div>

      <v-snackbar
        v-model="showToggleHint"
        :top="true"
        :timeout="6000"
      >
        Hint: try &nbsp;<span class="keycap"> spacebar </span>&nbsp; and &nbsp;<span class="keycap"> shift </span>-<span class="keycap"> space </span>&nbsp; to toggle
      </v-snackbar>
    </v-content>
  </v-app>
</template>

<script>
import Vue from 'vue'

import '../configure-vue'
//import '../plugins/vuetify'
import * as Vuetify from '../utils/vuetify'

import ImagePane from './ImagePane'
import PointList from './PointList'

import loadGeotiff from '../utils/geotiff'

import { zip_longest } from 'zip-array'
import { spawn } from 'threads'
import { save } from 'save-file'

// Since we go through two webpacks, and the 2nd one
// (done by jupyterlab) is the only one that's got the
// publicPath set right, we need to load the public path
// dynamically here BEFORE trying to instantiate the WarpWorker
// import { PageConfig } from '@jupyterlab/coreutils'
// eslint-disable-next-line
// __webpack_public_path__ = PageConfig.getOption('fullStaticUrl') + '/'
import WarpWorker from 'worker-loader?name=warp-worker.js!../utils/warp-worker.js'

window.Vuetify = Vuetify

const components = {
  ImagePane,
  PointList,
  ...Vuetify,
}

export default {
  name: 'rej',
  props: ['referenceURL', 'imageryURL', 'imageryTiffPath', 'referenceTiffPath', 'ptsCallback'],
  data() {
    return {
      referencePointColor: "#0a7bff",
      referencePoints: [],
      imageryPointColor: "#ed588d",
      imageryPoints: [],
      rmse: [],
      transform: null,
      referenceImage: null,
      imageryImage: null,
      warpedImage: null,
      showWarpedImage: true,
      numToggles: 0,
      autoWarp: false,
      warping: false,
      showToggleHint: false,
      numImagesLoading: 0,
      warpWorker: spawn(WarpWorker())
    }
  },
  components,
  methods: {
    isWidgetFocused() {
      console.error("IMPLEMENT Rej.vue isWidgetFocused(), currently spacebar to toggle is disabled")
      // TODO: implement this so we can safely trap keystrokes
      return false;
    },
    async predictPoint (pointNum) {
      const { transform: t } = await this.calculateTransform()
      const { x, y } = this.referencePoints[pointNum]
      const w = t[6]*x + t[7]*y + 1
      const transformedPoint = {
         x: (t[0]*x + t[1]*y + t[2]) / w,
         y: (t[3]*x + t[4]*y + t[5]) / w,
      }
      Vue.set(this.imageryPoints, pointNum, transformedPoint)
    },
    deletePointPair (index) {
      this.imageryPoints.splice(index, 1)
      this.referencePoints.splice(index, 1)
    },
    loadImage (url, prop) {
      this.numImagesLoading++
      setTimeout(async () => {
        url = await url
        if (!url) {
          this.numImagesLoading--
          return
        }
        console.log(`loadImage(${url}, ${prop})`)

        if (url.includes('.tif') && !url.includes('.png')) {
          loadGeotiff(url)
            .then(image => {
              this[prop] = image
              this.numImagesLoading--
            })
            .catch(message => {
              this.numImagesLoading--
              alert(`Error loading GeoTIFF:\n${url}\n${message}`)
              throw message
            })
        } else {
          const image = new window.Image()
          image.onload = () => {
            this[prop] = image
            this.numImagesLoading--
          }
          image.onerror = () => {
            this.numImagesLoading--
            const message = `Couldn't load PNG:\n${url}`
            alert(message)
            throw message
          }
          image.src = url
        }
      })
    },
    async savePTS () {
      const { pts, imageryURL } = this
      if (this.ptsCallback) {
        console.log("Calling: ", this.ptsCallback)
        this.ptsCallback(pts)
      } else {
        const filename = imageryURL ? imageryURL.substring(imageryURL.lastIndexOf('/')+1) + ".pts" : "gcps.pts"
        await save(pts, filename)
      }
      
    },
    async calculateTransform () {
      const warpWorker = await this.warpWorker
      const result = await warpWorker.calculateTransform({
        from: this.referencePoints, 
        to: this.imageryPoints, 
      })
      this.rmse = result.rmse
      this.transform = result.transform
      return result
    },
    async warp () {
      this.warping = true

      const { transform } = await this.calculateTransform()
      const image = await createImageBitmap(this.imageryImage)

      const warpWorker = await this.warpWorker
      const { warpedImage } = await warpWorker.warpImage({ transform, image })
      this.warpedImage = warpedImage
      this.showWarpedImage = true
      this.warping = false
    },
    async handlePointsChanged () {
      await this.calculateTransform()

      if (this.autoWarp && !this.warping) {
        try {
          await this.warp()
        } catch (e) {
          console.error(e)
        }
      }
    }
  },
  localStorage: {
    accessToken: {
      type: String
    },
    idToken: {
      type: String
    },
    authExpiresAt: {
      type: Number
    }
  },
  computed: {
    canWarp() {
      // eslint-disable-next-line
      return this.points.filter(([p1, p2, rmse]) => p1 && p2).length >= 4
    },
    points() {
      const shortestPointsLen = Math.min(this.imageryPoints.length, this.referencePoints.length)
      const rmse = this.rmse.slice(0, shortestPointsLen)
      return zip_longest(this.imageryPoints, this.referencePoints, rmse)
    },
    signedIn() {
      return this.$localStorage.idToken && Date.now() < this.$localStorage.authExpiresAt
    },
    pts() {
      const pointLines = this.points
        .filter(([warp, base]) => base && warp)
        .map(([warp, base]) => `\t${base.x}\t${base.y}\t${warp.x}\t${warp.y}`).join('\n')
      const pts = 
`; ENVI Image to Image GCP File
; base file: ${this.referenceTiffPath}
; warp file: ${this.imageryTiffPath}
; Base Image (x,y), Warp Image (x,y)
;
${pointLines}`
      console.log(pts)
      return pts
   },
  },
  watch: {
    numImagesLoading () {
      console.log("numImagesLoading=", this.numImagesLoading)
    },
    imageryURL () {
      this.loadImage(this.imageryURL, 'imageryImage')
    },
    referenceURL() {
      this.loadImage(this.referenceURL, 'referenceImage')
    },
    numToggles(val) {
      this.showToggleHint = val > 3
    },
    referencePoints: {
      handler() {
        this.handlePointsChanged()
      },
      deep: true
    },
    imageryPoints: {
      handler() {
        this.handlePointsChanged()
      },
      deep: true
    },
  },
  created() {
    this.loadImage(this.imageryURL, 'imageryImage')
    this.loadImage(this.referenceURL, 'referenceImage')
  },
  mounted() {
    document.addEventListener("keydown", (e) => {
      if (!this.isWidgetFocused()) return

      if (e.key == " " && !e.shiftKey) {
        e.stopPropagation()
        e.preventDefault()
        if (e.repeat) return

        this.showWarpedImage = !this.showWarpedImage
        console.log(e)

      }
    })
    document.addEventListener("keyup", (e) => {
      if (e.repeat || !this.isWidgetFocused()) return
      
      let handledKey = false
      if (e.key == " ") {
        this.showWarpedImage = !this.showWarpedImage
        handledKey = true
      } else if (e.key == "w") {
        this.warp()
        handledKey = true
      } else if (e.key == "s") {
        this.savePTS()
        handledKey = true
      }
      if (handledKey) {
        e.stopPropagation()
        e.preventDefault()
      }
    })   
  }
}
</script>

<style>
.registration-task {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  position: relative;
}

.jp-Cell .registration-task .v-application--wrap {
  /* We're in a Jupyter Cell, limit height to 90% of the browser window height
  minus 100 pixels for jupyterlab chrome */
  height: calc(90vh - 150px);
  min-height: 350px;
}

.registration-task .application--wrap {
  min-height: 350px;
}
</style>

<style>

.overhang-column {
  margin-left: -20px;
  margin-right: -20px;
  z-index: 2;
}

span.keycap {
  -webkit-border-radius: 4px;
  -moz-border-radius: 4px;
  -o-border-radius: 4px;
  -khtml-border-radius: 4px;
  white-space: nowrap;
  border: 1px solid #aaa;
  border-style: outset;
  border-radius: 4px;
  padding: 0px 3px 1px 3px;
  margin: 0px 0px 0px 0px;
  vertical-align: baseline;
  line-height: 1.8em;
  background: #fbfbfb;
  color: #666;
  font-size: 90%;
}

.extra-options-box {
  position: absolute;
  top: 0px;
  right: 1.5em;
  background-color: rgba(0,0,0,0);
  margin-top: -250px;
  animation: slideDown ease 1s forwards;
}


@keyframes slideDown {
  from { margin-top: -250px; }
  to   { margin-top: 0px; }
}

.point-list {
  background-color: rgba(252,252,252,0.9)!important;
  position: absolute;
  bottom: 10px;
  left: 10px;
  z-index: 10;
  text-align: left;
}
</style>
