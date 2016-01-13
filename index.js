/**
 * Description: index.js
 * Author: crossjs <liwenfu@crossjs.com>
 * Date: 2014-12-15 16:04:45
 */

'use strict';

var $ = require('jquery'),
  Overlay = require('nd-overlay'),
  mask = require('nd-mask'),
  Template = require('nd-template');

// Helpers
// ----
// 让目标节点可以被 Tab
function toTabed(element) {
  if (element.attr('tabindex') === null) {
    element.attr('tabindex', '-1');
  }
}

// Dialog
// ---
// Dialog 是通用对话框组件，提供显隐关闭、遮罩层、内容区域自定义功能。
// 是所有对话框类型组件的基类。
var Dialog = Overlay.extend({

  Implements: Template,

  attrs: {
    // 模板
    template: require('./src/dialog.handlebars'),

    // 对话框触发点
    trigger: {
      value: null,
      getter: function(val) {
        return $(val);
      }
    },

    // 统一样式前缀
    classPrefix: 'ui-dialog',

    // 指定内容元素，可以是 url 地址
    content: {
      value: null,
      setter: function(val) {
        // 判断是否是 url 地址
        this._ajax = /^(https?:\/\/|\/|\.\/|\.\.\/)/.test(val);
        return val;
      }
    },

    // 是否有背景遮罩层
    hasMask: true,

    // 是否点击遮罩关闭对话框
    hideOnClickMask: false,

    // 是否 Esc 键关闭对话框
    hideOnKeyEscape: true,

    // 关闭按钮可以自定义
    closeTpl: '×',

    // 默认宽度
    width: 'auto',

    // 默认高度
    height: null,

    // 简单的动画效果 none | fade
    effect: 'none',

    // 不用解释了吧
    zIndex: 999,

    // 默认定位左右居中
    align: {
      value: {
        selfXY: ['50%', '50%'],
        baseXY: ['50%', '50%']
      },
      getter: function(val) {
        // 高度超过窗口的 42/50 浮层头部顶住窗口
        // https://github.com/aralejs/dialog/issues/41
        if (this.element.height() > $(window).height() * 0.84) {
          return {
            selfXY: ['50%', '0'],
            baseXY: ['50%', '70px']
          };
        }
        return val;
      }
    }
  },

  parseElement: function() {
    Dialog.superclass.parseElement.call(this);

    this.contentElement = this.$('[data-role=content]');

    // 必要的样式
    this.contentElement.css({
      height: '100%',
      zoom: 1
    });

    // 关闭按钮先隐藏
    // 后面当 onRenderCloseTpl 时，如果 closeTpl 不为空，会显示出来
    // 这样写是为了回避 arale.base 的一个问题：
    // 当属性初始值为''时，不会进入 onRender 方法
    // https://github.com/aralejs/base/issues/7
    this.$('[data-role=close]').hide();
  },

  events: {
    'click [data-role=close]': function(e) {
      e.preventDefault();
      this.hide();
    }
  },

  show: function() {
      // ajax 读入内容并 append 到容器中
    if (this._ajax) {
      this._ajaxHtml();
    }

    Dialog.superclass.show.call(this);
    return this;
  },

  destroy: function() {
    this.element.remove();
    this._hideMask();
    return Dialog.superclass.destroy.call(this);
  },

  setup: function() {
    Dialog.superclass.setup.call(this);

    this._setupTrigger();
    this._setupMask();
    this._setupKeyEvents();
    this._setupFocus();
    toTabed(this.element);
    toTabed(this.get('trigger'));

    // 默认当前触发器
    this.activeTrigger = this.get('trigger').eq(0);
  },

  // onRender
  // ---
  _onRenderContent: function(val) {
    if (!this._ajax) {
      var value;
      // 有些情况会报错
      try {
        value = $(val);
      } catch (e) {
        value = [];
      }
      if (value[0]) {
        this.contentElement.empty().append(value);
      } else {
        this.contentElement.empty().html(val);
      }
      // #38 #44
      this._setPosition();
    }
  },

  _onRenderCloseTpl: function(val) {
    if (val === '') {
      this.$('[data-role=close]').html(val).hide();
    } else {
      this.$('[data-role=close]').html(val).show();
    }
  },

  // 覆盖 overlay，提供动画
  _onRenderVisible: function(val) {
    if (val) {
      var effect = this.get('effect');
      if (effect === 'fade') {
        // 固定 300 的动画时长，暂不可定制
        this.element.fadeIn(300);
      } else if (typeof effect === 'function') {
        // 支持自定义 effect，采用 function
        effect.call(this, this.element);
      } else {
        this.element.show();
      }
    } else {
      this.element.hide();
    }
  },

  // 私有方法
  // ---
  // 绑定触发对话框出现的事件
  _setupTrigger: function() {
    this.delegateEvents(this.get('trigger'), 'click', function(e) {
      e.preventDefault();
      // 标识当前点击的元素
      this.activeTrigger = $(e.currentTarget);
      this.show();
    });
  },

  // 绑定遮罩层事件
  _setupMask: function() {
    var that = this;

    // 存放 mask 对应的对话框
    var dialogs = mask._dialogs = mask._dialogs || [];

    this.after('show', function() {
      if (!this.get('hasMask')) {
        return;
      }

      // not using the z-index
      // because multiable dialogs may share same mask
      mask.set('zIndex', this.get('zIndex')).show();
      mask.element.insertBefore(this.element);

      // 避免重复存放
      var existed = false;

      for (var i = 0; i < dialogs.length; i++) {
        if (dialogs[i] === this) {
          existed = true;
        }
      }

      // 依次存放对应的对话框
      if (!existed) {
        dialogs.push(this);
      }

      // 点击遮罩关闭对话框
      if(this.get('hideOnClickMask')) {
        mask.delegateEvents('click.' + this.cid, function() {
          that.hide();
        });
      }
    });

    this.after('hide', this._hideMask);
  },

  // 隐藏 mask
  _hideMask: function() {
    if (!this.get('hasMask')) {
      return;
    }

    var dialogs = mask._dialogs,
      // 当前是否最后一个 dialog，即当前是否位于顶层
      currentIsLast = false;

    if (dialogs) {
      // check last
      if (dialogs[dialogs.length - 1] === this) {
        currentIsLast = true;
        dialogs.pop();
      }
      // check others
      else {
        for (var i = 0; i < dialogs.length - 1; i++) {
          /*jshint maxdepth:4*/
          if (dialogs[i] === this) {
            dialogs.splice(i, 1);
            break;
          }
        }
      }
    }

    if (dialogs && dialogs.length > 0) {
      // 如果当前是顶层，则寻找新的顶层，否则不做处理
      if (currentIsLast) {
        var last = dialogs[dialogs.length - 1];
        mask.set('zIndex', last.get('zIndex'));
        mask.element.insertBefore(last.element);
      }
    } else {
      mask.hide();
    }

    // 点击遮罩关闭对话框
    if(this.get('hideOnClickMask')) {
      mask.undelegateEvents('click.' + this.cid);
    }
  },

  // 绑定元素聚焦状态
  _setupFocus: function() {
    this.after('show', function() {
      this.element.focus();
    });
    this.after('hide', function() {
      // 关于网页中浮层消失后的焦点处理
      // http://www.qt06.com/post/280/
      this.activeTrigger && this.activeTrigger.focus();
    });
  },

  // 绑定键盘事件，ESC关闭窗口
  _setupKeyEvents: function() {
    if (this.get('hideOnKeyEscape')) {
      this.delegateEvents($(document), 'keyup.esc', function(e) {
        if (e.keyCode === 27) {
          this.get('visible') && this.hide();
        }
      });
    }
  },

  _ajaxHtml: function() {
    var that = this;
    this.contentElement.load(this.get('content'), function() {
      that._setPosition();
      that.trigger('complete:show');
    });
  }

});

module.exports = Dialog;
