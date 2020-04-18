<template>
  <div ref="container" class="image-pane-container fill-height" v-resize="handleResize">
    <v-stage ref="stage" class="image-pane"
      :config="configKonva"
      @DOMMouseScroll="mouseWheelZoom"
      @wheel="mouseWheelZoom"
      >
      <v-layer ref="layer">
        <v-image ref="image" @click="addPoint" :config="{ image: image }"/>
        <v-image v-if="warpedImage && showWarpedImage" ref="warped" :config="{ image: warpedImage }"/>
        <v-group v-for="(item, index) of points" :key="index">
          <v-circle :config="{
            x: item.x,
            y: item.y,
            radius: 3 / scale,
            fill: pointColor,
            draggable: true,
            hitFunc: function(context) {
              context.beginPath()
              context.arc(0, 0, this.radius() + 10 / scale, 0, Math.PI * 2, true)
              context.closePath()
              context.fillStrokeShape(this)
            },
            _point: item
          }"
            @dragmove="pointMoved(item, $event.target.attrs)"
            @dragend="pointMoved(item, $event.target.attrs)"
            @mouseenter="$refs.stage.$el.style.cursor = 'move'"
            @mouseleave="$refs.stage.$el.style.cursor = ''"
          />
          <v-text :config="{
            x: item.x + 5 / scale,
            y: item.y + 5 / scale,
            text: index + 1,
            fontSize: 12 / scale,
            fill: pointColor,
          }"
          />
        </v-group>
      </v-layer>
    </v-stage>
  </div>
</template>

<script>

export default {
  name: "image-pane",
  props: ['image', 'pointColor', 'warpedImage', 'showWarpedImage'],
  data() {
    return {
      scale: 1,
      configKonva: {
        width: 128,
        height: 128,
        draggable: true,
      },
      points: []
    }
  },
  watch: {
    scale: function (val) {
      this.stage.setScale({ x: val, y: val })
      this.$emit("scale-changed", val)
    },
    points: function (val) {
      this.$emit("points-changed", val)
    },
    image: function () {
      this.$nextTick(() => this.scaleToFit())
    },
  },
  methods: {
    scaleToFit() {
      const layerSize = this.$refs.image.getNode().getClientRect({
        relativeTo: this.stage,
      })
      const { width, height } = this.stage.getSize()
      this.scale = Math.min(
        width / layerSize.width, 
        height / layerSize.height
      ) * 0.8
      this.stage.position({
        x: 200,
        y: 100
      })
      this.stage.batchDraw()
    },
    pointMoved(point, { x, y }) {
      this.$refs.stage.$el.style.cursor = ''
      point.x = x
      point.y = y
    },
    addPoint() {
      const inverseTransform = this.imageNode.getAbsoluteTransform().copy().invert()
      this.points.push(
        inverseTransform.point(this.stage.getPointerPosition())
      )
    },
    setScale(newScale) {
      this.stage.scale({ x: newScale, y: newScale })
      this.scale = newScale
    },
    mouseWheelZoom({ evt }) {
      const { stage } = this
      const scaleFactor = 1.1

      evt.preventDefault()

      const oldScale = stage.scaleX()
      const mousePointTo = {
        x: stage.getPointerPosition().x / oldScale - stage.x() / oldScale,
        y: stage.getPointerPosition().y / oldScale - stage.y() / oldScale
      }

      const numScrollClicks = evt.wheelDelta ? evt.wheelDelta / 40 : evt.detail ? -evt.detail : 0
      if (!numScrollClicks) return

      const scaleBy = Math.pow(scaleFactor, numScrollClicks)
      this.scale = oldScale * scaleBy

      stage.position({
        x: -(mousePointTo.x - stage.getPointerPosition().x / this.scale) * this.scale,
        y: -(mousePointTo.y - stage.getPointerPosition().y / this.scale) * this.scale
      })
      stage.batchDraw()
    },
    handleResize() {
      console.log(`Width: ${this.$refs.container.clientWidth}`)
      this.stage.width(this.$refs.container.clientWidth)
      this.stage.height(this.$refs.container.clientHeight)
      this.scaleToFit()
    },
  },
  computed: {
    transform () {
      return this.stage.getTransform().m
    },
    stage () {
      return this.$refs.stage.getStage()
    },
    imageNode () {
      return this.$refs.image.getNode()
    },
    context () {
      return this.$refs.layer.getNode().getContext()._context
    }
  },
  mounted() {
    setTimeout(
      () => this.$nextTick(
        () => this.handleResize()
      )
    )

    /* We /want/ to see pixels, important for detailed high QC work */
    this.context.imageSmoothingEnabled = false
  }
}

</script>

<style scoped>
.image-pane {
  cursor: url(../assets/crosshair-cursor.png) 31 31, crosshair;
}
.image-pane-container {
  position: relative;
  overflow: hidden;
}
</style>