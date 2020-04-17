<template>
  <v-app
    dark
    class="registration-task"
  >
    <link href="//fonts.googleapis.com/css?family=Roboto:100,300,400,500,700,900" rel="stylesheet">
    <link href="//fonts.googleapis.com/css?family=Material+Icons" rel="stylesheet">
    <link href="//cdn.jsdelivr.net/npm/@mdi/font@3.x/css/materialdesignicons.min.css" rel="stylesheet">

    <v-btn v-if="!signedIn" @click="doAuth" style="display: none; position: absolute; top: 0px; left: 0px; z-index: 100">Login to Load TIFFs</v-btn>
    <v-content pa-0 ma-0>
      <v-layout align-top justify-center row fill-height>
        <v-flex xs6 grow style="position: relative">
          <ImagePane
            :image="referenceImage"
            :warpedImage="warpedImage"
            :showWarpedImage="showWarpedImage"
            :pointColor="referencePointColor"
            @points-changed="referencePoints = $event" 
          />
        </v-flex>

        <div style="position: relative">
          <div ref="box" class="vertical-center">
            <v-card ripple elevation="10" class="overhang-column">

              <v-card-text>
                <PointList 
                  v-if="points.length > 0" 
                  :showPredictBtns="canWarp"
                  :points="points" 
                  @predict-point="predictPoint"
                  :referencePointColor="referencePointColor" 
                  :imageryPointColor="imageryPointColor"
                />
                <div v-else>
                  <span style="font-style: italic; color: #aaa">Click matching features on the left and right to georeference right image.</span>
                </div>
              </v-card-text>
              
              <v-card-actions>
                <v-btn
                  color="primary"
                  @click="warp"
                  :disabled="!canWarp"
                  :loading="warping"
                >
                  Warp (w)
                </v-btn>
                <v-btn 
                  @click="savePTS"
                  :disabled="points.length <= 3"
                  flat
                  v-if="warpedImage"
                >
                  Save PTS (s)
                </v-btn>
              </v-card-actions>
            </v-card>
            <v-card v-if="points.length > 0" class="extra-options-box">
              <v-card-text>
                <v-checkbox :disabled="points.length < 4" v-model="autoWarp" title="Warp when points change" label="Auto-warp"/>
                <v-checkbox :disabled="!warpedImage" @change="numToggles += 1" v-model="showWarpedImage" title="Try [spacebar] to toggle" label="Overlay Warped Image" />
              </v-card-text>
            </v-card>

            <div v-if="numImagesLoading > 0" style="margin-top: 1em">
              <label>Downloading Image(s)...</label>
              <v-progress-linear indeterminate/>
            </div>

          </div>
        </div>

        <v-flex xs6 grow style="position: relative">
          <ImagePane
            :image="imageryImage"
            :pointColor="imageryPointColor"
            @points-changed="imageryPoints = $event"
          />
        </v-flex>
      </v-layout>

      <v-snackbar
        v-model="showToggleHint"
        :bottom="true"
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
import { PageConfig } from '@jupyterlab/coreutils'
// eslint-disable-next-line
__webpack_public_path__ = PageConfig.getOption('fullStaticUrl') + '/';
import WarpWorker from 'worker-loader?name=warp-worker.js!../utils/warp-worker.js'

window.Vuetify = Vuetify

const components = {
  ImagePane,
  PointList,
  ...Vuetify,
}

export default {
  name: 'registration-task',
  props: ['referenceURL', 'imageryURL'],
  data() {
    return {
      referencePointColor: "#FFFF00",
      referencePoints: [],
      imageryPointColor: "#00FFFF",
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
    loadImage (url, prop) {
      if (!url) return 

      this.numImagesLoading++
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
          console.log(`Couldn't load PNG:\n${url}`)
        }
        image.src = url
      }
    },
    async doAuth() {
      let authResponse
      const user = await this.$gAuth.signIn()
      if (this.$gAuth.isAuthorized) {
        authResponse = user.getAuthResponse()
      } else {
        alert("Couldn't sign in for some reason (???)")
      }

      if (authResponse) {
        window.authResponse = authResponse
        this.$localStorage.idToken = authResponse.id_token
        this.$localStorage.accessToken = authResponse.access_token
        this.$localStorage.authExpiresAt = authResponse.expires_at || authResponse.expiry_date
        this.$localStorage.refreshToken = authResponse.refresh_token
      }
    },
    async savePTS () {
      const { pts, imageryURL } = this
      const filename = imageryURL.substring(imageryURL.lastIndexOf('/')+1) + ".pts"
      await save(pts, filename)
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
      const { warpedImage } = await warpWorker.warpImage({
        transform: this.transform,
        image: image
      })
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
      return this.points.filter(([p1, p2, rmse]) => p1 && p2).length >= 4
    },
    s3() {
      const s3 = S3(this.$localStorage.idToken)
      window.s3 = s3
      return s3
    },
    points() {
      return zip_longest(this.referencePoints, this.imageryPoints, this.rmse)
    },
    signedIn() {
      return this.$localStorage.idToken && Date.now() < this.$localStorage.authExpiresAt
    },
    pts() {
      const pointLines = this.points
        .filter(([base, warp]) => base && warp)
        .map(([base, warp]) => `\t${base.x}\t${base.y}\t${warp.x}\t${warp.y}`).join('\n')
      const pts = `
; ENVI Image to Image GCP File
; base file: ${this.referenceURL}
; warp file: ${this.imageryURL}
; Base Image (x,y), Warp Image (x,y)
;
${pointLines}`
      console.log(pts)
      return pts
   },
  },
  watch: {
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
    }

  },
  created () {
    const { imageryURL, referenceURL } = this
    console.log("imageryURL: ", imageryURL)
    console.log("referenceURL: ", referenceURL)
    this.loadImage(imageryURL, 'imageryImage')
    this.loadImage(referenceURL, 'referenceImage')
  },
  mounted() {
    document.addEventListener("keydown", ({ key, repeat, shiftKey }) => {
      if (repeat) return
      if (key == " " && !shiftKey) {
        this.showWarpedImage = !this.showWarpedImage
      }
    })
    document.addEventListener("keyup", ({ key, repeat }) => {
      if (repeat) return
      if (key == " ") {
        this.showWarpedImage = !this.showWarpedImage
      } else if (key == "w") {
        this.warp()
      } else if (key == "s") {
        this.savePTS()
      }
    })   
  }
}
</script>

<style src='vuetify/dist/vuetify.min.css'>
  /* global styles */
</style> 

<style>
.registration-task {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  position: relative;
}

.jp-Cell .registration-task {
  /* We're in a Jupyter Cell, limit height to 90% of the browser window height
  minus 200 pixels for jupyterlab chrome */
 /*max-height: calc(90vh - 200px);*/
}

.registration-task .application--wrap {
  min-height: 350px;
}
</style>

<style scoped>

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
  animation: doFadeIn 2s ease forwards;
  position: absolute;
  width: 100%;
  background-color: #42424299;
  margin-top: -250px;
  animation: slideDown 2s ease 1s forwards;
}

@keyframes slideDown {
  from { margin-top: -250px; }
  to   { margin-top: 0px; }
}

.vertical-center {
  position: absolute;
  left: -135px;
  right: -135px;
  bottom: 0;
  z-index: 10;
}
</style>
