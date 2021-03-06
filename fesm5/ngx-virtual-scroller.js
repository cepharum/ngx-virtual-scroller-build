import { __decorate, __param } from 'tslib';
import { EventEmitter, ElementRef, Renderer2, NgZone, ChangeDetectorRef, Inject, PLATFORM_ID, Optional, Input, Output, ViewChild, ContentChild, Component, NgModule } from '@angular/core';
import { isPlatformServer, CommonModule } from '@angular/common';
import { Tween, Easing } from '@tweenjs/tween.js';

function VIRTUAL_SCROLLER_DEFAULT_OPTIONS_FACTORY() {
    return {
        checkResizeInterval: 1000,
        modifyOverflowStyleOfParentScroll: true,
        resizeBypassRefreshThreshold: 5,
        scrollAnimationTime: 750,
        scrollDebounceTime: 0,
        scrollThrottlingTime: 0,
        stripedTable: false
    };
}
var VirtualScrollerComponent = /** @class */ (function () {
    function VirtualScrollerComponent(element, renderer, zone, changeDetectorRef, 
    // tslint:disable-next-line:ban-types
    platformId, options) {
        this.element = element;
        this.renderer = renderer;
        this.zone = zone;
        this.changeDetectorRef = changeDetectorRef;
        this.window = window;
        this.executeRefreshOutsideAngularZone = false;
        this._enableUnequalChildrenSizes = false;
        this.RTL = false;
        this.useMarginInsteadOfTranslate = false;
        this.ssrViewportWidth = 1920;
        this.ssrViewportHeight = 1080;
        this._items = [];
        this.vsUpdate = new EventEmitter();
        this.vsChange = new EventEmitter();
        this.vsStart = new EventEmitter();
        this.vsEnd = new EventEmitter();
        this.calculatedScrollbarWidth = 0;
        this.calculatedScrollbarHeight = 0;
        this.padding = 0;
        this.previousViewPort = {};
        this.cachedPageSize = 0;
        this.previousScrollNumberElements = 0;
        this.compareItems = function (item1, item2) { return item1 === item2; };
        this.isAngularUniversalSSR = isPlatformServer(platformId);
        this.checkResizeInterval = options.checkResizeInterval;
        this.modifyOverflowStyleOfParentScroll = options.modifyOverflowStyleOfParentScroll;
        this.resizeBypassRefreshThreshold = options.resizeBypassRefreshThreshold;
        this.scrollAnimationTime = options.scrollAnimationTime;
        this.scrollDebounceTime = options.scrollDebounceTime;
        this.scrollThrottlingTime = options.scrollThrottlingTime;
        this.scrollbarHeight = options.scrollbarHeight;
        this.scrollbarWidth = options.scrollbarWidth;
        this.stripedTable = options.stripedTable;
        this.horizontal = false;
        this.resetWrapGroupDimensions();
    }
    Object.defineProperty(VirtualScrollerComponent.prototype, "viewPortInfo", {
        get: function () {
            var pageInfo = this.previousViewPort || {};
            return {
                startIndex: pageInfo.startIndex || 0,
                endIndex: pageInfo.endIndex || 0,
                scrollStartPosition: pageInfo.scrollStartPosition || 0,
                scrollEndPosition: pageInfo.scrollEndPosition || 0,
                maxScrollPosition: pageInfo.maxScrollPosition || 0,
                startIndexWithBuffer: pageInfo.startIndexWithBuffer || 0,
                endIndexWithBuffer: pageInfo.endIndexWithBuffer || 0
            };
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(VirtualScrollerComponent.prototype, "enableUnequalChildrenSizes", {
        get: function () {
            return this._enableUnequalChildrenSizes;
        },
        set: function (value) {
            if (this._enableUnequalChildrenSizes === value) {
                return;
            }
            this._enableUnequalChildrenSizes = value;
            this.minMeasuredChildWidth = undefined;
            this.minMeasuredChildHeight = undefined;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(VirtualScrollerComponent.prototype, "bufferAmount", {
        get: function () {
            if (typeof (this._bufferAmount) === 'number' && this._bufferAmount >= 0) {
                return this._bufferAmount;
            }
            else {
                return this.enableUnequalChildrenSizes ? 5 : 0;
            }
        },
        set: function (value) {
            this._bufferAmount = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(VirtualScrollerComponent.prototype, "scrollThrottlingTime", {
        get: function () {
            return this._scrollThrottlingTime;
        },
        set: function (value) {
            this._scrollThrottlingTime = value;
            this.updateOnScrollFunction();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(VirtualScrollerComponent.prototype, "scrollDebounceTime", {
        get: function () {
            return this._scrollDebounceTime;
        },
        set: function (value) {
            this._scrollDebounceTime = value;
            this.updateOnScrollFunction();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(VirtualScrollerComponent.prototype, "checkResizeInterval", {
        get: function () {
            return this._checkResizeInterval;
        },
        set: function (value) {
            if (this._checkResizeInterval === value) {
                return;
            }
            this._checkResizeInterval = value;
            this.addScrollEventHandlers();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(VirtualScrollerComponent.prototype, "items", {
        get: function () {
            return this._items;
        },
        set: function (value) {
            if (value === this._items) {
                return;
            }
            this._items = value || [];
            this.refresh_internal(true);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(VirtualScrollerComponent.prototype, "horizontal", {
        get: function () {
            return this._horizontal;
        },
        set: function (value) {
            this._horizontal = value;
            this.updateDirection();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(VirtualScrollerComponent.prototype, "parentScroll", {
        get: function () {
            return this._parentScroll;
        },
        set: function (value) {
            if (this._parentScroll === value) {
                return;
            }
            this.revertParentOverscroll();
            this._parentScroll = value;
            this.addScrollEventHandlers();
            var scrollElement = this.getScrollElement();
            if (this.modifyOverflowStyleOfParentScroll && scrollElement !== this.element.nativeElement) {
                this.oldParentScrollOverflow = { x: scrollElement.style['overflow-x'], y: scrollElement.style['overflow-y'] };
                scrollElement.style['overflow-y'] = this.horizontal ? 'visible' : 'auto';
                scrollElement.style['overflow-x'] = this.horizontal ? 'auto' : 'visible';
            }
        },
        enumerable: true,
        configurable: true
    });
    VirtualScrollerComponent.prototype.updateOnScrollFunction = function () {
        var _this_1 = this;
        if (this.scrollDebounceTime) {
            this.onScroll = this.debounce(function () {
                _this_1.refresh_internal(false);
            }, this.scrollDebounceTime);
        }
        else if (this.scrollThrottlingTime) {
            this.onScroll = this.throttleTrailing(function () {
                _this_1.refresh_internal(false);
            }, this.scrollThrottlingTime);
        }
        else {
            this.onScroll = function () {
                _this_1.refresh_internal(false);
            };
        }
    };
    VirtualScrollerComponent.prototype.revertParentOverscroll = function () {
        var scrollElement = this.getScrollElement();
        if (scrollElement && this.oldParentScrollOverflow) {
            scrollElement.style['overflow-y'] = this.oldParentScrollOverflow.y;
            scrollElement.style['overflow-x'] = this.oldParentScrollOverflow.x;
        }
        this.oldParentScrollOverflow = undefined;
    };
    VirtualScrollerComponent.prototype.ngOnInit = function () {
        this.addScrollEventHandlers();
    };
    VirtualScrollerComponent.prototype.ngOnDestroy = function () {
        this.removeScrollEventHandlers();
        this.revertParentOverscroll();
    };
    VirtualScrollerComponent.prototype.ngOnChanges = function (changes) {
        var indexLengthChanged = this.cachedItemsLength !== this.items.length;
        this.cachedItemsLength = this.items.length;
        var firstRun = !changes.items || !changes.items.previousValue || changes.items.previousValue.length === 0;
        this.refresh_internal(indexLengthChanged || firstRun);
    };
    VirtualScrollerComponent.prototype.ngDoCheck = function () {
        if (this.cachedItemsLength !== this.items.length) {
            this.cachedItemsLength = this.items.length;
            this.refresh_internal(true);
            return;
        }
        if (this.previousViewPort && this.viewPortItems && this.viewPortItems.length > 0) {
            var itemsArrayChanged = false;
            for (var i = 0; i < this.viewPortItems.length; ++i) {
                if (!this.compareItems(this.items[this.previousViewPort.startIndexWithBuffer + i], this.viewPortItems[i])) {
                    itemsArrayChanged = true;
                    break;
                }
            }
            if (itemsArrayChanged) {
                this.refresh_internal(true);
            }
        }
    };
    VirtualScrollerComponent.prototype.refresh = function () {
        this.refresh_internal(true);
    };
    VirtualScrollerComponent.prototype.invalidateAllCachedMeasurements = function () {
        this.wrapGroupDimensions = {
            maxChildSizePerWrapGroup: [],
            numberOfKnownWrapGroupChildSizes: 0,
            sumOfKnownWrapGroupChildWidths: 0,
            sumOfKnownWrapGroupChildHeights: 0
        };
        this.minMeasuredChildWidth = undefined;
        this.minMeasuredChildHeight = undefined;
        this.refresh_internal(false);
    };
    VirtualScrollerComponent.prototype.invalidateCachedMeasurementForItem = function (item) {
        if (this.enableUnequalChildrenSizes) {
            var index = this.items && this.items.indexOf(item);
            if (index >= 0) {
                this.invalidateCachedMeasurementAtIndex(index);
            }
        }
        else {
            this.minMeasuredChildWidth = undefined;
            this.minMeasuredChildHeight = undefined;
        }
        this.refresh_internal(false);
    };
    VirtualScrollerComponent.prototype.invalidateCachedMeasurementAtIndex = function (index) {
        if (this.enableUnequalChildrenSizes) {
            var cachedMeasurement = this.wrapGroupDimensions.maxChildSizePerWrapGroup[index];
            if (cachedMeasurement) {
                this.wrapGroupDimensions.maxChildSizePerWrapGroup[index] = undefined;
                --this.wrapGroupDimensions.numberOfKnownWrapGroupChildSizes;
                this.wrapGroupDimensions.sumOfKnownWrapGroupChildWidths -= cachedMeasurement.childWidth || 0;
                this.wrapGroupDimensions.sumOfKnownWrapGroupChildHeights -= cachedMeasurement.childHeight || 0;
            }
        }
        else {
            this.minMeasuredChildWidth = undefined;
            this.minMeasuredChildHeight = undefined;
        }
        this.refresh_internal(false);
    };
    VirtualScrollerComponent.prototype.scrollInto = function (item, alignToBeginning, additionalOffset, animationMilliseconds, animationCompletedCallback) {
        if (alignToBeginning === void 0) { alignToBeginning = true; }
        if (additionalOffset === void 0) { additionalOffset = 0; }
        var index = this.items.indexOf(item);
        if (index === -1) {
            return;
        }
        this.scrollToIndex(index, alignToBeginning, additionalOffset, animationMilliseconds, animationCompletedCallback);
    };
    VirtualScrollerComponent.prototype.scrollToIndex = function (index, alignToBeginning, additionalOffset, animationMilliseconds, animationCompletedCallback) {
        var _this_1 = this;
        if (alignToBeginning === void 0) { alignToBeginning = true; }
        if (additionalOffset === void 0) { additionalOffset = 0; }
        var maxRetries = 5;
        var retryIfNeeded = function () {
            --maxRetries;
            if (maxRetries <= 0) {
                if (animationCompletedCallback) {
                    animationCompletedCallback();
                }
                return;
            }
            var dimensions = _this_1.calculateDimensions();
            var desiredStartIndex = Math.min(Math.max(index, 0), dimensions.itemCount - 1);
            if (_this_1.previousViewPort.startIndex === desiredStartIndex) {
                if (animationCompletedCallback) {
                    animationCompletedCallback();
                }
                return;
            }
            _this_1.scrollToIndex_internal(index, alignToBeginning, additionalOffset, 0, retryIfNeeded);
        };
        this.scrollToIndex_internal(index, alignToBeginning, additionalOffset, animationMilliseconds, retryIfNeeded);
    };
    VirtualScrollerComponent.prototype.scrollToIndex_internal = function (index, alignToBeginning, additionalOffset, animationMilliseconds, animationCompletedCallback) {
        if (alignToBeginning === void 0) { alignToBeginning = true; }
        if (additionalOffset === void 0) { additionalOffset = 0; }
        animationMilliseconds = animationMilliseconds === undefined ? this.scrollAnimationTime : animationMilliseconds;
        var dimensions = this.calculateDimensions();
        var scroll = this.calculatePadding(index, dimensions) + additionalOffset;
        if (!alignToBeginning) {
            scroll -= dimensions.wrapGroupsPerPage * dimensions[this._childScrollDim];
        }
        this.scrollToPosition(scroll, animationMilliseconds, animationCompletedCallback);
    };
    VirtualScrollerComponent.prototype.scrollToPosition = function (scrollPosition, animationMilliseconds, animationCompletedCallback) {
        var _this_1 = this;
        scrollPosition += this.getElementsOffset();
        animationMilliseconds = animationMilliseconds === undefined ? this.scrollAnimationTime : animationMilliseconds;
        var scrollElement = this.getScrollElement();
        var animationRequest;
        if (this.currentTween) {
            this.currentTween.stop();
            this.currentTween = undefined;
        }
        if (!animationMilliseconds) {
            this.renderer.setProperty(scrollElement, this._scrollType, scrollPosition);
            this.refresh_internal(false, animationCompletedCallback);
            return;
        }
        var tweenConfigObj = { scrollPosition: scrollElement[this._scrollType] };
        var newTween = new Tween(tweenConfigObj)
            .to({ scrollPosition: scrollPosition }, animationMilliseconds)
            .easing(Easing.Quadratic.Out)
            .onUpdate(function (data) {
            if (isNaN(data.scrollPosition)) {
                return;
            }
            _this_1.renderer.setProperty(scrollElement, _this_1._scrollType, data.scrollPosition);
            _this_1.refresh_internal(false);
        })
            .onStop(function () {
            cancelAnimationFrame(animationRequest);
        })
            .start();
        var animate = function (time) {
            if (!newTween.isPlaying()) {
                return;
            }
            newTween.update(time);
            if (tweenConfigObj.scrollPosition === scrollPosition) {
                _this_1.refresh_internal(false, animationCompletedCallback);
                return;
            }
            _this_1.zone.runOutsideAngular(function () {
                animationRequest = requestAnimationFrame(animate);
            });
        };
        animate();
        this.currentTween = newTween;
    };
    VirtualScrollerComponent.prototype.getElementSize = function (element) {
        var result = element.getBoundingClientRect();
        var styles = getComputedStyle(element);
        var marginTop = parseInt(styles['margin-top'], 10) || 0;
        var marginBottom = parseInt(styles['margin-bottom'], 10) || 0;
        var marginLeft = parseInt(styles['margin-left'], 10) || 0;
        var marginRight = parseInt(styles['margin-right'], 10) || 0;
        return {
            top: result.top + marginTop,
            bottom: result.bottom + marginBottom,
            left: result.left + marginLeft,
            right: result.right + marginRight,
            width: result.width + marginLeft + marginRight,
            height: result.height + marginTop + marginBottom
        };
    };
    VirtualScrollerComponent.prototype.checkScrollElementResized = function () {
        var boundingRect = this.getElementSize(this.getScrollElement());
        var sizeChanged;
        if (!this.previousScrollBoundingRect) {
            sizeChanged = true;
        }
        else {
            var widthChange = Math.abs(boundingRect.width - this.previousScrollBoundingRect.width);
            var heightChange = Math.abs(boundingRect.height - this.previousScrollBoundingRect.height);
            sizeChanged = widthChange > this.resizeBypassRefreshThreshold || heightChange > this.resizeBypassRefreshThreshold;
        }
        if (sizeChanged) {
            this.previousScrollBoundingRect = boundingRect;
            if (boundingRect.width > 0 && boundingRect.height > 0) {
                this.refresh_internal(false);
            }
        }
    };
    VirtualScrollerComponent.prototype.updateDirection = function () {
        if (this.horizontal) {
            this._childScrollDim = 'childWidth';
            this._invisiblePaddingProperty = 'scaleX';
            this._marginDir = 'margin-left';
            this._offsetType = 'offsetLeft';
            this._pageOffsetType = 'pageXOffset';
            this._scrollType = 'scrollLeft';
            this._translateDir = 'translateX';
        }
        else {
            this._childScrollDim = 'childHeight';
            this._invisiblePaddingProperty = 'scaleY';
            this._marginDir = 'margin-top';
            this._offsetType = 'offsetTop';
            this._pageOffsetType = 'pageYOffset';
            this._scrollType = 'scrollTop';
            this._translateDir = 'translateY';
        }
    };
    VirtualScrollerComponent.prototype.debounce = function (func, wait) {
        var throttled = this.throttleTrailing(func, wait);
        var result = function () {
            throttled.cancel();
            throttled.apply(this, arguments);
        };
        result.cancel = function () {
            throttled.cancel();
        };
        return result;
    };
    VirtualScrollerComponent.prototype.throttleTrailing = function (func, wait) {
        var timeout;
        var _arguments = arguments;
        var result = function () {
            var _this = this;
            _arguments = arguments;
            if (timeout) {
                return;
            }
            if (wait <= 0) {
                func.apply(_this, _arguments);
            }
            else {
                timeout = setTimeout(function () {
                    timeout = undefined;
                    func.apply(_this, _arguments);
                }, wait);
            }
        };
        result.cancel = function () {
            if (timeout) {
                clearTimeout(timeout);
                timeout = undefined;
            }
        };
        return result;
    };
    VirtualScrollerComponent.prototype.refresh_internal = function (itemsArrayModified, refreshCompletedCallback, maxRunTimes) {
        // note: maxRunTimes is to force it to keep recalculating if the previous iteration caused a re-render
        //       (different sliced items in viewport or scrollPosition changed).
        // The default of 2x max will probably be accurate enough without causing too large a performance bottleneck
        // The code would typically quit out on the 2nd iteration anyways. The main time it'd think more than 2 runs
        // would be necessary would be for vastly different sized child items or if this is the 1st time the items array
        // was initialized.
        // Without maxRunTimes, If the user is actively scrolling this code would become an infinite loop until they
        // stopped scrolling. This would be okay, except each scroll event would start an additional infinite loop. We
        // want to short-circuit it to prevent this.
        var _this_1 = this;
        if (maxRunTimes === void 0) { maxRunTimes = 2; }
        if (itemsArrayModified && this.previousViewPort && this.previousViewPort.scrollStartPosition > 0) {
            // if items were prepended, scroll forward to keep same items visible
            var oldViewPort_1 = this.previousViewPort;
            var oldViewPortItems_1 = this.viewPortItems;
            var oldRefreshCompletedCallback_1 = refreshCompletedCallback;
            refreshCompletedCallback = function () {
                var scrollLengthDelta = _this_1.previousViewPort.scrollLength - oldViewPort_1.scrollLength;
                if (scrollLengthDelta > 0 && _this_1.viewPortItems) {
                    var offset = _this_1.previousViewPort.startIndex - _this_1.previousViewPort.startIndexWithBuffer;
                    var oldStartItem = oldViewPortItems_1[offset];
                    var oldStartItemIndex = -1;
                    for (var i = 0, l = _this_1.items, n = _this_1.items.length; i < n; i++) {
                        if (_this_1.compareItems(oldStartItem, l[i])) {
                            oldStartItemIndex = i;
                            break;
                        }
                    }
                    if (oldStartItemIndex > _this_1.previousViewPort.startIndex) {
                        var itemOrderChanged = false;
                        for (var i = 1, l = _this_1.viewPortItems.length - offset; i < l; ++i) {
                            if (!_this_1.compareItems(_this_1.items[oldStartItemIndex + i], oldViewPortItems_1[offset + i])) {
                                itemOrderChanged = true;
                                break;
                            }
                        }
                        if (!itemOrderChanged) {
                            _this_1.scrollToPosition(_this_1.previousViewPort.scrollStartPosition + scrollLengthDelta, 0, oldRefreshCompletedCallback_1);
                            return;
                        }
                    }
                }
                if (oldRefreshCompletedCallback_1) {
                    oldRefreshCompletedCallback_1();
                }
            };
        }
        this.zone.runOutsideAngular(function () {
            requestAnimationFrame(function () {
                if (itemsArrayModified) {
                    _this_1.resetWrapGroupDimensions();
                }
                var viewport = _this_1.calculateViewport();
                var startChanged = itemsArrayModified || viewport.startIndex !== _this_1.previousViewPort.startIndex;
                var endChanged = itemsArrayModified || viewport.endIndex !== _this_1.previousViewPort.endIndex;
                var scrollLengthChanged = viewport.scrollLength !== _this_1.previousViewPort.scrollLength;
                var paddingChanged = viewport.padding !== _this_1.previousViewPort.padding;
                var scrollPositionChanged = viewport.scrollStartPosition !== _this_1.previousViewPort.scrollStartPosition ||
                    viewport.scrollEndPosition !== _this_1.previousViewPort.scrollEndPosition ||
                    viewport.maxScrollPosition !== _this_1.previousViewPort.maxScrollPosition;
                _this_1.previousViewPort = viewport;
                if (scrollLengthChanged) {
                    _this_1.renderer.setStyle(_this_1.invisiblePaddingElementRef.nativeElement, 'transform', _this_1._invisiblePaddingProperty + "(" + viewport.scrollLength + ")");
                    _this_1.renderer.setStyle(_this_1.invisiblePaddingElementRef.nativeElement, 'webkitTransform', _this_1._invisiblePaddingProperty + "(" + viewport.scrollLength + ")");
                }
                if (paddingChanged) {
                    if (_this_1.useMarginInsteadOfTranslate) {
                        _this_1.renderer.setStyle(_this_1.contentElementRef.nativeElement, _this_1._marginDir, viewport.padding + "px");
                    }
                    else {
                        _this_1.renderer.setStyle(_this_1.contentElementRef.nativeElement, 'transform', _this_1._translateDir + "(" + viewport.padding + "px)");
                        _this_1.renderer.setStyle(_this_1.contentElementRef.nativeElement, 'webkitTransform', _this_1._translateDir + "(" + viewport.padding + "px)");
                    }
                }
                if (_this_1.headerElementRef) {
                    var scrollPosition = _this_1.getScrollElement()[_this_1._scrollType];
                    var containerOffset = _this_1.getElementsOffset();
                    var offset = Math.max(scrollPosition - viewport.padding - containerOffset +
                        _this_1.headerElementRef.nativeElement.clientHeight, 0);
                    _this_1.renderer.setStyle(_this_1.headerElementRef.nativeElement, 'transform', _this_1._translateDir + "(" + offset + "px)");
                    _this_1.renderer.setStyle(_this_1.headerElementRef.nativeElement, 'webkitTransform', _this_1._translateDir + "(" + offset + "px)");
                }
                var changeEventArg = (startChanged || endChanged) ? {
                    startIndex: viewport.startIndex,
                    endIndex: viewport.endIndex,
                    scrollStartPosition: viewport.scrollStartPosition,
                    scrollEndPosition: viewport.scrollEndPosition,
                    startIndexWithBuffer: viewport.startIndexWithBuffer,
                    endIndexWithBuffer: viewport.endIndexWithBuffer,
                    maxScrollPosition: viewport.maxScrollPosition
                } : undefined;
                if (startChanged || endChanged || scrollPositionChanged) {
                    var handleChanged = function () {
                        // update the scroll list to trigger re-render of components in viewport
                        _this_1.viewPortItems = viewport.startIndexWithBuffer >= 0 && viewport.endIndexWithBuffer >= 0 ?
                            _this_1.items.slice(viewport.startIndexWithBuffer, viewport.endIndexWithBuffer + 1) : [];
                        _this_1.vsUpdate.emit(_this_1.viewPortItems);
                        if (startChanged) {
                            _this_1.vsStart.emit(changeEventArg);
                        }
                        if (endChanged) {
                            _this_1.vsEnd.emit(changeEventArg);
                        }
                        if (startChanged || endChanged) {
                            _this_1.changeDetectorRef.markForCheck();
                            _this_1.vsChange.emit(changeEventArg);
                        }
                        if (maxRunTimes > 0) {
                            _this_1.refresh_internal(false, refreshCompletedCallback, maxRunTimes - 1);
                            return;
                        }
                        if (refreshCompletedCallback) {
                            refreshCompletedCallback();
                        }
                    };
                    if (_this_1.executeRefreshOutsideAngularZone) {
                        handleChanged();
                    }
                    else {
                        _this_1.zone.run(handleChanged);
                    }
                }
                else {
                    if (maxRunTimes > 0 && (scrollLengthChanged || paddingChanged)) {
                        _this_1.refresh_internal(false, refreshCompletedCallback, maxRunTimes - 1);
                        return;
                    }
                    if (refreshCompletedCallback) {
                        refreshCompletedCallback();
                    }
                }
            });
        });
    };
    VirtualScrollerComponent.prototype.getScrollElement = function () {
        return this.parentScroll instanceof Window ? document.scrollingElement || document.documentElement ||
            document.body : this.parentScroll || this.element.nativeElement;
    };
    VirtualScrollerComponent.prototype.addScrollEventHandlers = function () {
        var _this_1 = this;
        if (this.isAngularUniversalSSR) {
            return;
        }
        var scrollElement = this.getScrollElement();
        this.removeScrollEventHandlers();
        this.zone.runOutsideAngular(function () {
            if (_this_1.parentScroll instanceof Window) {
                _this_1.disposeScrollHandler = _this_1.renderer.listen('window', 'scroll', _this_1.onScroll);
                _this_1.disposeResizeHandler = _this_1.renderer.listen('window', 'resize', _this_1.onScroll);
            }
            else {
                _this_1.disposeScrollHandler = _this_1.renderer.listen(scrollElement, 'scroll', _this_1.onScroll);
                if (_this_1._checkResizeInterval > 0) {
                    _this_1.checkScrollElementResizedTimer = setInterval(function () {
                        _this_1.checkScrollElementResized();
                    }, _this_1._checkResizeInterval);
                }
            }
        });
    };
    VirtualScrollerComponent.prototype.removeScrollEventHandlers = function () {
        if (this.checkScrollElementResizedTimer) {
            clearInterval(this.checkScrollElementResizedTimer);
        }
        if (this.disposeScrollHandler) {
            this.disposeScrollHandler();
            this.disposeScrollHandler = undefined;
        }
        if (this.disposeResizeHandler) {
            this.disposeResizeHandler();
            this.disposeResizeHandler = undefined;
        }
    };
    VirtualScrollerComponent.prototype.getElementsOffset = function () {
        if (this.isAngularUniversalSSR) {
            return 0;
        }
        var offset = 0;
        if (this.containerElementRef && this.containerElementRef.nativeElement) {
            offset += this.containerElementRef.nativeElement[this._offsetType];
        }
        if (this.parentScroll) {
            var scrollElement = this.getScrollElement();
            var elementClientRect = this.getElementSize(this.element.nativeElement);
            var scrollClientRect = this.getElementSize(scrollElement);
            if (this.horizontal) {
                offset += elementClientRect.left - scrollClientRect.left;
            }
            else {
                offset += elementClientRect.top - scrollClientRect.top;
            }
            if (!(this.parentScroll instanceof Window)) {
                offset += scrollElement[this._scrollType];
            }
        }
        return offset;
    };
    VirtualScrollerComponent.prototype.countItemsPerWrapGroup = function () {
        if (this.isAngularUniversalSSR) {
            return Math.round(this.horizontal ? this.ssrViewportHeight / this.ssrChildHeight : this.ssrViewportWidth / this.ssrChildWidth);
        }
        var propertyName = this.horizontal ? 'offsetLeft' : 'offsetTop';
        var children = ((this.containerElementRef && this.containerElementRef.nativeElement) ||
            this.contentElementRef.nativeElement).children;
        var childrenLength = children ? children.length : 0;
        if (childrenLength === 0) {
            return 1;
        }
        var firstOffset = children[0][propertyName];
        var result = 1;
        while (result < childrenLength && firstOffset === children[result][propertyName]) {
            ++result;
        }
        return result;
    };
    VirtualScrollerComponent.prototype.getScrollStartPosition = function () {
        var windowScrollValue;
        if (this.parentScroll instanceof Window) {
            windowScrollValue = window[this._pageOffsetType];
        }
        return windowScrollValue || this.getScrollElement()[this._scrollType] || 0;
    };
    VirtualScrollerComponent.prototype.resetWrapGroupDimensions = function () {
        var oldWrapGroupDimensions = this.wrapGroupDimensions;
        this.invalidateAllCachedMeasurements();
        if (!this.enableUnequalChildrenSizes || !oldWrapGroupDimensions || oldWrapGroupDimensions.numberOfKnownWrapGroupChildSizes === 0) {
            return;
        }
        var itemsPerWrapGroup = this.countItemsPerWrapGroup();
        for (var wrapGroupIndex = 0; wrapGroupIndex < oldWrapGroupDimensions.maxChildSizePerWrapGroup.length; ++wrapGroupIndex) {
            var oldWrapGroupDimension = oldWrapGroupDimensions.maxChildSizePerWrapGroup[wrapGroupIndex];
            if (!oldWrapGroupDimension || !oldWrapGroupDimension.items || !oldWrapGroupDimension.items.length) {
                continue;
            }
            if (oldWrapGroupDimension.items.length !== itemsPerWrapGroup) {
                return;
            }
            var itemsChanged = false;
            var arrayStartIndex = itemsPerWrapGroup * wrapGroupIndex;
            for (var i = 0; i < itemsPerWrapGroup; ++i) {
                if (!this.compareItems(oldWrapGroupDimension.items[i], this.items[arrayStartIndex + i])) {
                    itemsChanged = true;
                    break;
                }
            }
            if (!itemsChanged) {
                ++this.wrapGroupDimensions.numberOfKnownWrapGroupChildSizes;
                this.wrapGroupDimensions.sumOfKnownWrapGroupChildWidths += oldWrapGroupDimension.childWidth || 0;
                this.wrapGroupDimensions.sumOfKnownWrapGroupChildHeights += oldWrapGroupDimension.childHeight || 0;
                this.wrapGroupDimensions.maxChildSizePerWrapGroup[wrapGroupIndex] = oldWrapGroupDimension;
            }
        }
    };
    VirtualScrollerComponent.prototype.calculateDimensions = function () {
        var scrollElement = this.getScrollElement();
        var maxCalculatedScrollBarSize = 25; // Note: Formula to auto-calculate doesn't work for ParentScroll,
        //       so we default to this if not set by consuming application
        this.calculatedScrollbarHeight = Math.max(Math.min(scrollElement.offsetHeight - scrollElement.clientHeight, maxCalculatedScrollBarSize), this.calculatedScrollbarHeight);
        this.calculatedScrollbarWidth = Math.max(Math.min(scrollElement.offsetWidth - scrollElement.clientWidth, maxCalculatedScrollBarSize), this.calculatedScrollbarWidth);
        var viewportWidth = scrollElement.offsetWidth - (this.scrollbarWidth || this.calculatedScrollbarWidth ||
            (this.horizontal ? 0 : maxCalculatedScrollBarSize));
        var viewportHeight = scrollElement.offsetHeight - (this.scrollbarHeight || this.calculatedScrollbarHeight ||
            (this.horizontal ? maxCalculatedScrollBarSize : 0));
        var content = (this.containerElementRef && this.containerElementRef.nativeElement) || this.contentElementRef.nativeElement;
        var itemsPerWrapGroup = this.countItemsPerWrapGroup();
        var wrapGroupsPerPage;
        var defaultChildWidth;
        var defaultChildHeight;
        if (this.isAngularUniversalSSR) {
            viewportWidth = this.ssrViewportWidth;
            viewportHeight = this.ssrViewportHeight;
            defaultChildWidth = this.ssrChildWidth;
            defaultChildHeight = this.ssrChildHeight;
            var itemsPerRow = Math.max(Math.ceil(viewportWidth / defaultChildWidth), 1);
            var itemsPerCol = Math.max(Math.ceil(viewportHeight / defaultChildHeight), 1);
            wrapGroupsPerPage = this.horizontal ? itemsPerRow : itemsPerCol;
        }
        else if (!this.enableUnequalChildrenSizes) {
            if (content.children.length > 0) {
                if (!this.childWidth || !this.childHeight) {
                    if (!this.minMeasuredChildWidth && viewportWidth > 0) {
                        this.minMeasuredChildWidth = viewportWidth;
                    }
                    if (!this.minMeasuredChildHeight && viewportHeight > 0) {
                        this.minMeasuredChildHeight = viewportHeight;
                    }
                }
                var child = content.children[0];
                var clientRect = this.getElementSize(child);
                this.minMeasuredChildWidth = Math.min(this.minMeasuredChildWidth, clientRect.width);
                this.minMeasuredChildHeight = Math.min(this.minMeasuredChildHeight, clientRect.height);
            }
            defaultChildWidth = this.childWidth || this.minMeasuredChildWidth || viewportWidth;
            defaultChildHeight = this.childHeight || this.minMeasuredChildHeight || viewportHeight;
            var itemsPerRow = Math.max(Math.ceil(viewportWidth / defaultChildWidth), 1);
            var itemsPerCol = Math.max(Math.ceil(viewportHeight / defaultChildHeight), 1);
            wrapGroupsPerPage = this.horizontal ? itemsPerRow : itemsPerCol;
        }
        else {
            var scrollOffset = scrollElement[this._scrollType] - (this.previousViewPort ? this.previousViewPort.padding : 0);
            var arrayStartIndex = this.previousViewPort.startIndexWithBuffer || 0;
            var wrapGroupIndex = Math.ceil(arrayStartIndex / itemsPerWrapGroup);
            var maxWidthForWrapGroup = 0;
            var maxHeightForWrapGroup = 0;
            var sumOfVisibleMaxWidths = 0;
            var sumOfVisibleMaxHeights = 0;
            wrapGroupsPerPage = 0;
            // tslint:disable-next-line:prefer-for-of
            for (var i = 0; i < content.children.length; ++i) {
                ++arrayStartIndex;
                var child = content.children[i];
                var clientRect = this.getElementSize(child);
                maxWidthForWrapGroup = Math.max(maxWidthForWrapGroup, clientRect.width);
                maxHeightForWrapGroup = Math.max(maxHeightForWrapGroup, clientRect.height);
                if (arrayStartIndex % itemsPerWrapGroup === 0) {
                    var oldValue = this.wrapGroupDimensions.maxChildSizePerWrapGroup[wrapGroupIndex];
                    if (oldValue) {
                        --this.wrapGroupDimensions.numberOfKnownWrapGroupChildSizes;
                        this.wrapGroupDimensions.sumOfKnownWrapGroupChildWidths -= oldValue.childWidth || 0;
                        this.wrapGroupDimensions.sumOfKnownWrapGroupChildHeights -= oldValue.childHeight || 0;
                    }
                    ++this.wrapGroupDimensions.numberOfKnownWrapGroupChildSizes;
                    var items = this.items.slice(arrayStartIndex - itemsPerWrapGroup, arrayStartIndex);
                    this.wrapGroupDimensions.maxChildSizePerWrapGroup[wrapGroupIndex] = {
                        childWidth: maxWidthForWrapGroup,
                        childHeight: maxHeightForWrapGroup,
                        items: items
                    };
                    this.wrapGroupDimensions.sumOfKnownWrapGroupChildWidths += maxWidthForWrapGroup;
                    this.wrapGroupDimensions.sumOfKnownWrapGroupChildHeights += maxHeightForWrapGroup;
                    if (this.horizontal) {
                        var maxVisibleWidthForWrapGroup = Math.min(maxWidthForWrapGroup, Math.max(viewportWidth - sumOfVisibleMaxWidths, 0));
                        if (scrollOffset > 0) {
                            var scrollOffsetToRemove = Math.min(scrollOffset, maxVisibleWidthForWrapGroup);
                            maxVisibleWidthForWrapGroup -= scrollOffsetToRemove;
                            scrollOffset -= scrollOffsetToRemove;
                        }
                        sumOfVisibleMaxWidths += maxVisibleWidthForWrapGroup;
                        if (maxVisibleWidthForWrapGroup > 0 && viewportWidth >= sumOfVisibleMaxWidths) {
                            ++wrapGroupsPerPage;
                        }
                    }
                    else {
                        var maxVisibleHeightForWrapGroup = Math.min(maxHeightForWrapGroup, Math.max(viewportHeight - sumOfVisibleMaxHeights, 0));
                        if (scrollOffset > 0) {
                            var scrollOffsetToRemove = Math.min(scrollOffset, maxVisibleHeightForWrapGroup);
                            maxVisibleHeightForWrapGroup -= scrollOffsetToRemove;
                            scrollOffset -= scrollOffsetToRemove;
                        }
                        sumOfVisibleMaxHeights += maxVisibleHeightForWrapGroup;
                        if (maxVisibleHeightForWrapGroup > 0 && viewportHeight >= sumOfVisibleMaxHeights) {
                            ++wrapGroupsPerPage;
                        }
                    }
                    ++wrapGroupIndex;
                    maxWidthForWrapGroup = 0;
                    maxHeightForWrapGroup = 0;
                }
            }
            var averageChildWidth = this.wrapGroupDimensions.sumOfKnownWrapGroupChildWidths /
                this.wrapGroupDimensions.numberOfKnownWrapGroupChildSizes;
            var averageChildHeight = this.wrapGroupDimensions.sumOfKnownWrapGroupChildHeights /
                this.wrapGroupDimensions.numberOfKnownWrapGroupChildSizes;
            defaultChildWidth = this.childWidth || averageChildWidth || viewportWidth;
            defaultChildHeight = this.childHeight || averageChildHeight || viewportHeight;
            if (this.horizontal) {
                if (viewportWidth > sumOfVisibleMaxWidths) {
                    wrapGroupsPerPage += Math.ceil((viewportWidth - sumOfVisibleMaxWidths) / defaultChildWidth);
                }
            }
            else {
                if (viewportHeight > sumOfVisibleMaxHeights) {
                    wrapGroupsPerPage += Math.ceil((viewportHeight - sumOfVisibleMaxHeights) / defaultChildHeight);
                }
            }
        }
        var itemCount = this.items.length;
        var itemsPerPage = itemsPerWrapGroup * wrapGroupsPerPage;
        var pageCountFractional = itemCount / itemsPerPage;
        var numberOfWrapGroups = Math.ceil(itemCount / itemsPerWrapGroup);
        var scrollLength = 0;
        var defaultScrollLengthPerWrapGroup = this.horizontal ? defaultChildWidth : defaultChildHeight;
        if (this.enableUnequalChildrenSizes) {
            var numUnknownChildSizes = 0;
            for (var i = 0; i < numberOfWrapGroups; ++i) {
                var childSize = this.wrapGroupDimensions.maxChildSizePerWrapGroup[i] &&
                    this.wrapGroupDimensions.maxChildSizePerWrapGroup[i][this._childScrollDim];
                if (childSize) {
                    scrollLength += childSize;
                }
                else {
                    ++numUnknownChildSizes;
                }
            }
            scrollLength += Math.round(numUnknownChildSizes * defaultScrollLengthPerWrapGroup);
        }
        else {
            scrollLength = numberOfWrapGroups * defaultScrollLengthPerWrapGroup;
        }
        if (this.headerElementRef) {
            scrollLength += this.headerElementRef.nativeElement.clientHeight;
        }
        var viewportLength = this.horizontal ? viewportWidth : viewportHeight;
        var maxScrollPosition = Math.max(scrollLength - viewportLength, 0);
        return {
            childHeight: defaultChildHeight,
            childWidth: defaultChildWidth,
            itemCount: itemCount,
            itemsPerPage: itemsPerPage,
            itemsPerWrapGroup: itemsPerWrapGroup,
            maxScrollPosition: maxScrollPosition,
            pageCount_fractional: pageCountFractional,
            scrollLength: scrollLength,
            viewportLength: viewportLength,
            wrapGroupsPerPage: wrapGroupsPerPage,
        };
    };
    VirtualScrollerComponent.prototype.calculatePadding = function (arrayStartIndexWithBuffer, dimensions) {
        if (dimensions.itemCount === 0) {
            return 0;
        }
        var defaultScrollLengthPerWrapGroup = dimensions[this._childScrollDim];
        var startingWrapGroupIndex = Math.floor(arrayStartIndexWithBuffer / dimensions.itemsPerWrapGroup) || 0;
        if (!this.enableUnequalChildrenSizes) {
            return defaultScrollLengthPerWrapGroup * startingWrapGroupIndex;
        }
        var numUnknownChildSizes = 0;
        var result = 0;
        for (var i = 0; i < startingWrapGroupIndex; ++i) {
            var childSize = this.wrapGroupDimensions.maxChildSizePerWrapGroup[i] &&
                this.wrapGroupDimensions.maxChildSizePerWrapGroup[i][this._childScrollDim];
            if (childSize) {
                result += childSize;
            }
            else {
                ++numUnknownChildSizes;
            }
        }
        result += Math.round(numUnknownChildSizes * defaultScrollLengthPerWrapGroup);
        return result;
    };
    VirtualScrollerComponent.prototype.calculatePageInfo = function (scrollPosition, dimensions) {
        var scrollPercentage = 0;
        if (this.enableUnequalChildrenSizes) {
            var numberOfWrapGroups = Math.ceil(dimensions.itemCount / dimensions.itemsPerWrapGroup);
            var totalScrolledLength = 0;
            var defaultScrollLengthPerWrapGroup = dimensions[this._childScrollDim];
            for (var i = 0; i < numberOfWrapGroups; ++i) {
                var childSize = this.wrapGroupDimensions.maxChildSizePerWrapGroup[i] &&
                    this.wrapGroupDimensions.maxChildSizePerWrapGroup[i][this._childScrollDim];
                if (childSize) {
                    totalScrolledLength += childSize;
                }
                else {
                    totalScrolledLength += defaultScrollLengthPerWrapGroup;
                }
                if (scrollPosition < totalScrolledLength) {
                    scrollPercentage = i / numberOfWrapGroups;
                    break;
                }
            }
        }
        else {
            scrollPercentage = scrollPosition / dimensions.scrollLength;
        }
        var startingArrayIndexFractional = Math.min(Math.max(scrollPercentage * dimensions.pageCount_fractional, 0), dimensions.pageCount_fractional) * dimensions.itemsPerPage;
        var maxStart = dimensions.itemCount - dimensions.itemsPerPage - 1;
        var arrayStartIndex = Math.min(Math.floor(startingArrayIndexFractional), maxStart);
        arrayStartIndex -= arrayStartIndex % dimensions.itemsPerWrapGroup; // round down to start of wrapGroup
        if (this.stripedTable) {
            var bufferBoundary = 2 * dimensions.itemsPerWrapGroup;
            if (arrayStartIndex % bufferBoundary !== 0) {
                arrayStartIndex = Math.max(arrayStartIndex - arrayStartIndex % bufferBoundary, 0);
            }
        }
        var arrayEndIndex = Math.ceil(startingArrayIndexFractional) + dimensions.itemsPerPage - 1;
        var endIndexWithinWrapGroup = (arrayEndIndex + 1) % dimensions.itemsPerWrapGroup;
        if (endIndexWithinWrapGroup > 0) {
            arrayEndIndex += dimensions.itemsPerWrapGroup - endIndexWithinWrapGroup; // round up to end of wrapGroup
        }
        if (isNaN(arrayStartIndex)) {
            arrayStartIndex = 0;
        }
        if (isNaN(arrayEndIndex)) {
            arrayEndIndex = 0;
        }
        arrayStartIndex = Math.min(Math.max(arrayStartIndex, 0), dimensions.itemCount - 1);
        arrayEndIndex = Math.min(Math.max(arrayEndIndex, 0), dimensions.itemCount - 1);
        var bufferSize = this.bufferAmount * dimensions.itemsPerWrapGroup;
        var startIndexWithBuffer = Math.min(Math.max(arrayStartIndex - bufferSize, 0), dimensions.itemCount - 1);
        var endIndexWithBuffer = Math.min(Math.max(arrayEndIndex + bufferSize, 0), dimensions.itemCount - 1);
        return {
            startIndex: arrayStartIndex,
            endIndex: arrayEndIndex,
            startIndexWithBuffer: startIndexWithBuffer,
            endIndexWithBuffer: endIndexWithBuffer,
            scrollStartPosition: scrollPosition,
            scrollEndPosition: scrollPosition + dimensions.viewportLength,
            maxScrollPosition: dimensions.maxScrollPosition
        };
    };
    VirtualScrollerComponent.prototype.calculateViewport = function () {
        var dimensions = this.calculateDimensions();
        var offset = this.getElementsOffset();
        var scrollStartPosition = this.getScrollStartPosition();
        if (scrollStartPosition > (dimensions.scrollLength + offset) && !(this.parentScroll instanceof Window)) {
            scrollStartPosition = dimensions.scrollLength;
        }
        else {
            scrollStartPosition -= offset;
        }
        scrollStartPosition = Math.max(0, scrollStartPosition);
        var pageInfo = this.calculatePageInfo(scrollStartPosition, dimensions);
        var newPadding = this.calculatePadding(pageInfo.startIndexWithBuffer, dimensions);
        var newScrollLength = dimensions.scrollLength;
        return {
            startIndex: pageInfo.startIndex,
            endIndex: pageInfo.endIndex,
            startIndexWithBuffer: pageInfo.startIndexWithBuffer,
            endIndexWithBuffer: pageInfo.endIndexWithBuffer,
            padding: Math.round(newPadding),
            scrollLength: Math.round(newScrollLength),
            scrollStartPosition: pageInfo.scrollStartPosition,
            scrollEndPosition: pageInfo.scrollEndPosition,
            maxScrollPosition: pageInfo.maxScrollPosition
        };
    };
    VirtualScrollerComponent.ctorParameters = function () { return [
        { type: ElementRef },
        { type: Renderer2 },
        { type: NgZone },
        { type: ChangeDetectorRef },
        { type: Object, decorators: [{ type: Inject, args: [PLATFORM_ID,] }] },
        { type: undefined, decorators: [{ type: Optional }, { type: Inject, args: ['virtual-scroller-default-options',] }] }
    ]; };
    __decorate([
        Input()
    ], VirtualScrollerComponent.prototype, "enableUnequalChildrenSizes", null);
    __decorate([
        Input()
    ], VirtualScrollerComponent.prototype, "bufferAmount", null);
    __decorate([
        Input()
    ], VirtualScrollerComponent.prototype, "scrollThrottlingTime", null);
    __decorate([
        Input()
    ], VirtualScrollerComponent.prototype, "scrollDebounceTime", null);
    __decorate([
        Input()
    ], VirtualScrollerComponent.prototype, "checkResizeInterval", null);
    __decorate([
        Input()
    ], VirtualScrollerComponent.prototype, "items", null);
    __decorate([
        Input()
    ], VirtualScrollerComponent.prototype, "horizontal", null);
    __decorate([
        Input()
    ], VirtualScrollerComponent.prototype, "parentScroll", null);
    __decorate([
        Input()
    ], VirtualScrollerComponent.prototype, "executeRefreshOutsideAngularZone", void 0);
    __decorate([
        Input()
    ], VirtualScrollerComponent.prototype, "RTL", void 0);
    __decorate([
        Input()
    ], VirtualScrollerComponent.prototype, "useMarginInsteadOfTranslate", void 0);
    __decorate([
        Input()
    ], VirtualScrollerComponent.prototype, "modifyOverflowStyleOfParentScroll", void 0);
    __decorate([
        Input()
    ], VirtualScrollerComponent.prototype, "stripedTable", void 0);
    __decorate([
        Input()
    ], VirtualScrollerComponent.prototype, "scrollbarWidth", void 0);
    __decorate([
        Input()
    ], VirtualScrollerComponent.prototype, "scrollbarHeight", void 0);
    __decorate([
        Input()
    ], VirtualScrollerComponent.prototype, "childWidth", void 0);
    __decorate([
        Input()
    ], VirtualScrollerComponent.prototype, "childHeight", void 0);
    __decorate([
        Input()
    ], VirtualScrollerComponent.prototype, "ssrChildWidth", void 0);
    __decorate([
        Input()
    ], VirtualScrollerComponent.prototype, "ssrChildHeight", void 0);
    __decorate([
        Input()
    ], VirtualScrollerComponent.prototype, "ssrViewportWidth", void 0);
    __decorate([
        Input()
    ], VirtualScrollerComponent.prototype, "ssrViewportHeight", void 0);
    __decorate([
        Input()
    ], VirtualScrollerComponent.prototype, "scrollAnimationTime", void 0);
    __decorate([
        Input()
    ], VirtualScrollerComponent.prototype, "resizeBypassRefreshThreshold", void 0);
    __decorate([
        Output()
    ], VirtualScrollerComponent.prototype, "vsUpdate", void 0);
    __decorate([
        Output()
    ], VirtualScrollerComponent.prototype, "vsChange", void 0);
    __decorate([
        Output()
    ], VirtualScrollerComponent.prototype, "vsStart", void 0);
    __decorate([
        Output()
    ], VirtualScrollerComponent.prototype, "vsEnd", void 0);
    __decorate([
        ViewChild('content', { read: ElementRef, static: true })
    ], VirtualScrollerComponent.prototype, "contentElementRef", void 0);
    __decorate([
        ViewChild('invisiblePadding', { read: ElementRef, static: true })
    ], VirtualScrollerComponent.prototype, "invisiblePaddingElementRef", void 0);
    __decorate([
        ContentChild('header', { read: ElementRef, static: false })
    ], VirtualScrollerComponent.prototype, "headerElementRef", void 0);
    __decorate([
        ContentChild('container', { read: ElementRef, static: false })
    ], VirtualScrollerComponent.prototype, "containerElementRef", void 0);
    __decorate([
        Input()
    ], VirtualScrollerComponent.prototype, "compareItems", void 0);
    VirtualScrollerComponent = __decorate([
        Component({
            selector: 'virtual-scroller,[virtualScroller]',
            exportAs: 'virtualScroller',
            template: "\n        <div class=\"total-padding\" #invisiblePadding></div>\n        <div class=\"scrollable-content\" #content>\n            <ng-content></ng-content>\n        </div>\n    ",
            host: {
                '[class.horizontal]': 'horizontal',
                '[class.vertical]': '!horizontal',
                '[class.selfScroll]': '!parentScroll',
                '[class.rtl]': 'RTL'
            },
            styles: ["\n        :host {\n            position: relative;\n            display: block;\n            -webkit-overflow-scrolling: touch;\n        }\n\n        :host.horizontal.selfScroll {\n            overflow-y: visible;\n            overflow-x: auto;\n        }\n\n        :host.horizontal.selfScroll.rtl {\n            transform: scaleX(-1);\n        }\n\n        :host.vertical.selfScroll {\n            overflow-y: auto;\n            overflow-x: visible;\n        }\n\n        .scrollable-content {\n            top: 0;\n            left: 0;\n            width: 100%;\n            height: 100%;\n            max-width: 100vw;\n            max-height: 100vh;\n            position: absolute;\n        }\n\n        .scrollable-content ::ng-deep > * {\n            box-sizing: border-box;\n        }\n\n        :host.horizontal {\n            white-space: nowrap;\n        }\n\n        :host.horizontal .scrollable-content {\n            display: flex;\n        }\n\n        :host.horizontal .scrollable-content ::ng-deep > * {\n            flex-shrink: 0;\n            flex-grow: 0;\n            white-space: initial;\n        }\n\n        :host.horizontal.rtl .scrollable-content ::ng-deep > * {\n            transform: scaleX(-1);\n        }\n\n        .total-padding {\n            position: absolute;\n            top: 0;\n            left: 0;\n            height: 1px;\n            width: 1px;\n            transform-origin: 0 0;\n            opacity: 0;\n        }\n\n        :host.horizontal .total-padding {\n            height: 100%;\n        }\n    "]
        }),
        __param(4, Inject(PLATFORM_ID)),
        __param(5, Optional()), __param(5, Inject('virtual-scroller-default-options'))
    ], VirtualScrollerComponent);
    return VirtualScrollerComponent;
}());
var VirtualScrollerModule = /** @class */ (function () {
    function VirtualScrollerModule() {
    }
    VirtualScrollerModule = __decorate([
        NgModule({
            exports: [VirtualScrollerComponent],
            declarations: [VirtualScrollerComponent],
            imports: [CommonModule],
            providers: [
                {
                    provide: 'virtual-scroller-default-options',
                    useFactory: VIRTUAL_SCROLLER_DEFAULT_OPTIONS_FACTORY
                }
            ]
        })
    ], VirtualScrollerModule);
    return VirtualScrollerModule;
}());

/**
 * Generated bundle index. Do not edit.
 */

export { VIRTUAL_SCROLLER_DEFAULT_OPTIONS_FACTORY, VirtualScrollerComponent, VirtualScrollerModule };
//# sourceMappingURL=ngx-virtual-scroller.js.map
