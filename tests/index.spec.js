'use strict'

var $ = require('nd-jquery')
var chai = require('chai')
var sinonChai = require('sinon-chai')
var Dialog = require('../index')
var mask = require('nd-mask')

var expect = chai.expect
var sinon = window.sinon

chai.use(sinonChai)

// require('../src/dialog.css');

/*globals mocha,describe,it,afterEach*/

mocha.setup({
  ignoreLeaks: true
})

describe('dialog', function() {
  var example

  afterEach(function() {
    if (example) {
      example.hide()
      example.destroy()
      example = null
    }
  })

  describe('content', function() {

    it('is dom', function() {
      $('<div id="test1">test1</div>').appendTo(document.body)
      example = new Dialog({
        content: $('#test1')
      })
      example.render()

      var test = example.$('.ui-dialog-content').children().eq(0)
      expect(test.attr('id')).to.equal('test1')
      expect(test.html()).to.equal('test1')
    })

    it('is string', function() {
      example = new Dialog({
        content: 'test2'
      })
      example.render()

      expect(example.$('.ui-dialog-content').html()).to.equal('test2')
    })

    it('is html', function() {
      example = new Dialog({
        content: '<div id="test3">test3</div>'
      })
      example.render()

      var test = example.$('.ui-dialog-content').children().eq(0)
      expect(test.attr('id')).to.equal('test3')
      expect(test.html()).to.equal('test3')
    })

    // it('is relative url', function(done) {
    //   example = new Dialog({
    //     content: './a.html'
    //   })
    //   example.render().show()

    //   example.on('complete:show', function() {
    //     expect(example.contentElement.html().trim('\n')).to.equal('<p>a.html</p>')
    //     done()
    //   })
    // })

    it('is invalid url', function() {
      example = new Dialog({
        content: 'demo.html'
      })
      example.render().show()

      expect(example.contentElement.html().trim('\n')).to.equal('demo.html')
    })

    it('changing content should reset position', function() {
      example = new Dialog({
        content: 'foobar'
      })
      example.show()
      var top = example.element.css('top')
      example.set('content', '<p>foo</p><p>bar</p>')
      expect(top).not.to.equal(example.element.css('top'))
    })
  })

  describe('Height', function() {
    it('should init without height when type is dom', function() {
      example = new Dialog({
        content: '<div id="test" style="height:200px;"></div>'
      })

      var spy = sinon.spy(example, '_onRenderHeight')

      example.show()
      expect(example._onRenderHeight.called).not.to.be.ok
      spy.restore()
    })

    it('should init with height when type is dom', function() {
      example = new Dialog({
        height: '300px',
        content: '<div id="test" style="height:200px;"></div>'
      })

      var spy = sinon.spy(example, '_onRenderHeight')

      example.show()
      expect(spy.withArgs('300px').called).to.be.ok
      spy.restore()
    })

    // it('should init without height when type is ajax', function(done) {
    //   example = new Dialog({
    //     content: './a.html'
    //   })

    //   var height = example.contentElement.height()

    //   example.on('complete:show', function() {
    //     expect(example.contentElement.height()).not.to.equal(height)
    //     done()
    //   })

    //   example.show()
    // })

    // it('should init with height when type is ajax', function(done) {
    //   example = new Dialog({
    //     height: '200px',
    //     content: './a.html'
    //   })

    //   var spy = sinon.spy(example, '_onRenderHeight')

    //   example.on('complete:show', function() {
    //     expect(spy.withArgs('200px').called).to.be.ok
    //     spy.restore()
    //     done()
    //   })

    //   example.show()
    // })

    // it('should be align top when dialog element is very high', function() {
    //   example = new Dialog({
    //     content: 'foobar',
    //     height: 5000
    //   })

    //   example.show()
    //   expect(example.element.offset().top).to.equal(0)
    // })

  })

  describe('events: show and hide', function() {

    it('click trigger to show', function() {
      var test = $('<div id="test"></div>')
      test.appendTo('body')
      example = new Dialog({
        content: 'foobar',
        trigger: '#test'
      })
      expect(example.get('visible')).not.to.be.ok
      test.click()
      expect(example.get('visible')).to.be.ok
      test.remove()
    })

    it('click close to hide', function() {
      example = new Dialog({
        content: 'foobar'
      })
      expect(example.get('visible')).not.to.be.ok
      example.show()
      expect(example.get('visible')).to.be.ok
      example.element.find('[data-role=close]').click()
      expect(example.get('visible')).not.to.be.ok
    })

    it('bind key close event', function() {
      example = new Dialog({
        content: 'foobar'
      })
      example.show()
      expect(example.get('visible')).to.be.ok
      // 模拟一个键盘事件
      var e = $.Event('keyup')
      e.keyCode = 27
      example.element.trigger(e)
      expect(example.get('visible')).not.to.be.ok
    })

    it('before show set content', function() {
      example = new Dialog().before('show', function() {
        this.set('content', 'test')
      }).render()
      expect(example.contentElement.html()).to.equal('')
      example.show()
      expect(example.contentElement.html()).to.equal('test')
    })

    // it('should call onload once', function(done) {
    //   example = new Dialog({
    //     content: './b.html',
    //     hasMask: false
    //   })

    //   var setPosition = sinon.spy(example, '_setPosition')
    //   var onRenderHeight = sinon.spy(example, '_onRenderHeight')

    //   example.show()

    //   example.on('complete:show', function() {
    //     expect(setPosition.callCount).to.equal(3)
    //     expect(onRenderHeight.callCount).to.equal(0)
    //     setPosition.restore()
    //     onRenderHeight.restore()
    //     done()
    //   })
    // })

    it('should hide close link', function() {
      example = new Dialog({
        content: 'should hide close link',
        closeTpl: ''
      })
      example.show()
      expect(example.element.find('[data-role=close]').is(':visible')).to.be.false
      example.set('closeTpl', 'X')
      expect(example.element.find('[data-role=close]').is(':visible')).to.be.true
      example.set('closeTpl', '')
      expect(example.element.find('[data-role=close]').is(':visible')).to.be.false
    })

    // it('should have a worked complete:show event', function(done) {
    //   example = new Dialog({
    //     content: './b.html'
    //   })
    //   example.on('complete:show', function() {
    //     done()
    //   })
    //   example.show()
    // })

  })

  describe('mask', function() {

    it('should have mask', function() {
      example = new Dialog({
        content: 'foobar'
      })
      example.show()
      expect($('.ui-mask').is(':visible')).to.be.true
    })

    it('should not have mask', function() {
      example = new Dialog({
        content: 'foobar',
        hasMask: false
      })
      example.show()
      expect($('.ui-mask').is(':visible')).to.be.false
    })

    it('should disappear when click mask', function() {
      example = new Dialog({
        content: 'foobar',
        hideOnClickMask: true
      })
      example.show()
      expect(example.element.is(':visible')).to.be.true
      mask.element.click()
      expect(example.element.is(':visible')).to.be.false
    })

    it('should not disappear when click mask', function() {
      example = new Dialog({
        content: 'foobar'
      })
      example.show()
      expect(example.element.is(':visible')).to.be.true
      mask.element.click()
      expect(example.element.is(':visible')).to.be.true
    })

    it('should hide the mask when last dialog hide', function() {
      example = new Dialog({
        content: 'foo'
      })
      example.show()

      expect(mask._dialogs.length).to.equal(1)
      expect(mask.get('visible')).to.be.true
      expect(mask.element.next()[0]).to.equal(example.element[0])

      var example2 = new Dialog({
        content: 'bar'
      })

      example2.show()
      expect(mask._dialogs.length).to.equal(2)
      expect(mask.get('visible')).to.be.true
      expect(mask.element.next()[0]).to.equal(example2.element[0])

      example2.hide() // will destroy example2
      expect(mask._dialogs.length).to.equal(1)
      expect(mask.get('visible')).to.be.true
      expect(mask.element.next()[0]).to.equal(example.element[0])

      example.hide()
      expect(mask._dialogs.length).to.equal(0)
      expect(mask.get('visible')).to.be.false

      example2.destroy()
    })

    it('should not hide the mask when other dialog is visible', function() {
      example = new Dialog({
        content: 'foo'
      })
      example.show()

      expect(mask._dialogs.length).to.equal(1)
      expect(mask.get('visible')).to.be.true
      expect(mask.element.next()[0]).to.equal(example.element[0])

      var example2 = new Dialog({
        content: 'bar'
      }).after('hide', function() {
        this.destroy()
      })

      example2.show()
      expect(mask._dialogs.length).to.equal(2)
      expect(mask.get('visible')).to.be.true
      expect(mask.element.next()[0]).to.equal(example2.element[0])

      example2.hide() // will destroy example2
      expect(mask._dialogs.length).to.equal(1)
      expect(mask.get('visible')).to.be.true
      expect(mask.element.next()[0]).to.equal(example.element[0])

      example.hide()
      expect(mask._dialogs.length).to.equal(0)
      expect(mask.get('visible')).to.be.false
    })

    it('should remove from mask._dialogs when a NOT last dialog is hide', function() {
      example = new Dialog({
        content: 'foo'
      })
      example.show()

      expect(mask._dialogs.length).to.equal(1)
      expect(mask.get('visible')).to.be.true
      expect(mask.element.next()[0]).to.equal(example.element[0])

      var example2 = new Dialog({
        content: 'bar'
      })

      example2.show()
      expect(mask._dialogs.length).to.equal(2)
      expect(mask.get('visible')).to.be.true
      expect(mask.element.next()[0]).to.equal(example2.element[0])

      example.hide()
      expect(mask._dialogs.length).to.equal(1)
      expect(mask.get('visible')).to.be.true
      expect(mask.element.next()[0]).to.equal(example2.element[0])

      example2.hide()
      expect(mask._dialogs.length).to.equal(0)
      expect(mask.get('visible')).to.be.false

      example2.destroy()
    })

    it('set hasMask works', function() {
      var example = new Dialog({
        content: 'foobar'
      })
      example.show()
      expect(mask.get('visible')).to.be.true
      example.hide()
      example.set('hasMask', false)
      example.show()
      expect(mask.get('visible')).to.be.false
      example.hide()
      example.set('hasMask', true)
      example.show()
      expect(mask.get('visible')).to.be.true
      example.hide()
    })

    it('should hide mask', function() {
      example = new Dialog({
        content: 'foobar'
      })
      example.show()
      example.show()
      expect(mask.get('visible')).to.be.true
      example.hide()
      expect(mask.get('visible')).to.be.false
    })

  })

  describe('other attributes', function() {
    it('fade effect should work', function(done) {
      example = new Dialog({
        content: 'foobar',
        effect: 'fade',
        duration: 1000
      })
      expect(example.get('effect')).to.equal('fade')
      example.show()
      setTimeout(function() {
        expect(example.element.css('opacity')).to.be.within(0, 1)
        done()
      }, 30)
    })
  })

  describe('issues', function() {
    it('#43', function() {
      example = new Dialog({
        content: 'foo'
      })
      example.show()
      var example2 = new Dialog({
        content: 'bar'
      })
      example2.show()
      expect(mask.element.is(':visible')).to.be.true
      example2.destroy()
      expect(mask.element.is(':visible')).to.be.true
      example.hide()
      expect(mask.element.is(':visible')).to.be.false
    })

    it('#47', function() {
      example = new Dialog({
        content: 'foobar'
      })
      example.show()
      expect(mask.element.is(':visible')).to.be.true
      example.destroy()
      expect(mask.element.is(':visible')).to.be.false
    })
  })

})
