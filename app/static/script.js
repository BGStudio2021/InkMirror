// 初始化部分
onload = function () {
    init();
}
// 初始化
function init() {
    init_canvas();
    init_pen();
    init_palette();
    init_menus();
    init_dialogs();
    init_gestures();
    init_dragdrop();
    init_paste();
    init_socket();
    init_others();
}
// 初始化画布
function init_canvas() {
    // 准备画布
    canvas = new fabric.Canvas('canvas', {
        backgroundColor: '#1e272c'
    });
    // 自动调整画布大小
    resizeCanvas();
    onresize = resizeCanvas;
    // 选择区域样式
    canvas.selectionColor = "rgba(174, 191, 219, 0.25)";
    canvas.selectionBorderColor = 'rgb(174, 191, 219)';
    // 控制器样式
    fabric.InteractiveFabricObject.ownDefaults = {
        ...fabric.InteractiveFabricObject.ownDefaults,
        transparentCorners: false,
        cornerStyle: 'circle',
        borderColor: 'rgb(174, 191, 219)',
        cornerColor: '#ffffff',
        cornerSize: 15
    }
    // 绑定事件
    // 创建选择区域
    canvas.on('selection:created', function (e) {
        if (currentPenMode === 'eraser') { // 准备橡皮擦
            // 暂停惭怍记录
            recordingState = false;
            // 逐个擦除选中对象，并取消选择
            e.selected.forEach(function (obj) {
                canvas.remove(obj);
            });
            canvas.discardActiveObject();
            // 恢复惭怍记录
            recordingState = true;
            handleCanvasChange();
        } else {
            // 置顶选中对象
            e.selected.forEach(function (obj) {
                canvas.bringObjectToFront(obj);
            });
            handleCanvasChange();
            // 允许调整样式
            document.querySelector('.btn-style').classList.remove('toolbar-item-disabled');
            document.querySelector('.dialog-style').classList.remove('dialog-disabled');
            // 允许复制
            document.querySelector('.btn-copy').classList.remove('grid-item-disabled');
            // 允许修改图层
            document.querySelectorAll('.btn-layerAction').forEach(function (btn) {
                btn.classList.remove('grid-item-disabled');
            });
        }
    });
    // 更新选择区域
    canvas.on('selection:updated', function (e) {
        // 置顶选中对象
        e.selected.forEach(function (obj) {
            canvas.bringObjectToFront(obj);
            handleCanvasChange();
        });
    })
    // 清除选择区域
    canvas.on('selection:cleared', function () {
        // 禁止调整样式
        document.querySelector('.btn-style').classList.add('toolbar-item-disabled');
        document.querySelector('.dialog-style').classList.add('dialog-disabled');
        // 禁止复制
        document.querySelector('.btn-copy').classList.add('grid-item-disabled');
        // 禁止修改图层
        document.querySelectorAll('.btn-layerAction').forEach(function (btn) {
            btn.classList.add('grid-item-disabled');
        });
    });
    // 鼠标按下
    canvas.on('mouse:down', function () {
        closeAllDialogs(); // 自动关闭对话框
    });
    // 阻止上下文菜单
    canvas.wrapperEl.oncontextmenu = function (e) {
        e.preventDefault();
    };
    // 监听所有可能改变画布内容的事件
    const changeEvents = ['object:added', 'object:removed', 'object:modified'];
    changeEvents.forEach(event => {
        canvas.on(event, function () {
            // 记录操作并报告
            handleCanvasChange();
            console.log(event);
        });
    });
    // 保存画布初始状态
    handleCanvasChange({ post: false });
}
// 初始化画笔
function init_pen() {
    // 准备画笔
    canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
    canvas.freeDrawingBrush.color = '#ffffff';
    canvas.freeDrawingBrush.width = 2;
    setTimeout(() => {
        setPenMode('pen');
    }, 600);
    // 监听画笔参数更改
    document.querySelector('.input-penOpacity').addEventListener('input', function () {
        setPenOpacity(this.value);
    });
    document.querySelector('.input-penSize').addEventListener('input', function () {
        setPenSize(this.value);
    });
    ["mousedown", "touchstart"].forEach(function (event) {
        document.querySelector('.input-penSize').addEventListener(event, function () {
            var size = canvas.freeDrawingBrush.width;
            var preview = document.querySelector('.penPreview');
            preview.style.transform = "scale(" + size / 25 + ")";
        });
    });
    ["mouseup", "touchend"].forEach(function (event) {
        document.querySelector('.input-penSize').addEventListener(event, function () {
            var preview = document.querySelector('.penPreview');
            preview.style.transform = "scale(0.8)";
        });
    });
}
// 初始化调色板
function init_palette() {
    // 准备调色板
    var palette = document.querySelector('.palette-pen');
    var colors = ['#ffffff', '#EF5350', '#EC407A', '#AB47BC', '#7E57C2', '#5C6BC0', '#42A5F5', '#29B6F6', '#26C6DA', '#26A69A', '#66BB6A', '#9CCC65', '#D4E157', '#FFEE58', '#FFCA28', '#FFA726', '#FF7043', '#8D6E63', '#BDBDBD', '#78909C'];
    colors.forEach(function (color) {
        var paletteItem = document.createElement('div');
        paletteItem.classList.add('palette-item');
        paletteItem.style.backgroundColor = color;
        paletteItem.addEventListener('click', function () {
            setPenColor(color);
        });
        palette.appendChild(paletteItem);
    });
    // 自定义颜色
    var customColorButton = document.createElement('div');
    var customColorInput = document.querySelector('.input-customColor');
    customColorButton.classList.add('palette-item', 'palette-item-customColor');
    customColorButton.innerHTML = `<img src="/static/icons/more_horiz.svg" style="filter: invert(1);">`;
    customColorButton.onclick = function () {
        customColorInput.click();
    };
    palette.appendChild(customColorButton);
    customColorInput.addEventListener('change', function () {
        setPenColor(this.value);
    });
    // 更新画笔预览
    updatePenPreview();
}
// 初始化菜单
function init_menus() {
    // 形状菜单
    document.querySelector('.btn-shape').onclick = function () {
        closeAllDialogs('.dialog-shape');
        toggleDialog('.dialog-shape', { autoPos: true });
    };
    // 样式菜单
    document.querySelector('.btn-style').onclick = function () {
        closeAllDialogs('.dialog-style');
        toggleDialog('.dialog-style', { autoPos: true });
    };
    // 更多菜单
    document.querySelector('.btn-more').onclick = function () {
        closeAllDialogs('.dialog-more');
        toggleDialog('.dialog-more', { autoPos: true });
    }
}
// 初始化对话框
function init_dialogs() {
    // 跟踪鼠标（用于定位对话框）
    var lastX_tracker = ['.penMode-eraser', '.penMode-pen', '.btn-shape', '.btn-style', '.btn-more'];
    lastX_tracker.forEach(function (selector) {
        document.querySelector(selector).addEventListener('mousedown', function (e) {
            lastX = e.clientX;
        });
        document.querySelector(selector).addEventListener('touchstart', function (e) {
            lastX = e.touches[0].clientX;
        });
    });
    // 拖拽对话框
    var dialog_draggable = ['.dialog-penOptions', '.dialog-shape', '.dialog-style', '.dialog-more'];
    dialog_draggable.forEach(function (selector) {
        var dialog = document.querySelector(selector);
        var dialog_dragger = dialog.querySelector(selector + ' .dialog-dragger');
        dialog_dragger.addEventListener('mousedown', _dragDialog);
        dialog_dragger.addEventListener('touchstart', _dragDialog);
        function _dragDialog(_e) {
            _e.preventDefault();
            var x = _e.clientX || _e.touches[0].clientX;
            var y = _e.clientY || _e.touches[0].clientY;
            fixDialog(selector, true);
            var _x = dialog.offsetLeft - x;
            var _y = dialog.offsetTop - y;
            document.addEventListener('mousemove', _dragDialog_);
            document.addEventListener('touchmove', _dragDialog_);
            document.addEventListener('mouseup', dragDialog_);
            document.addEventListener('touchend', dragDialog_);
            function _dragDialog_(_e_) {
                _e_.preventDefault();
                var x = _e_.clientX || _e_.touches[0].clientX;
                var y = _e_.clientY || _e_.touches[0].clientY;
                var _x_ = x + _x;
                var _y_ = y + _y;
                dialog.style.left = _x_ + 'px';
                dialog.style.bottom = document.body.clientHeight - _y_ - dialog.offsetHeight + 'px';
            }
            function dragDialog_(e_) {
                e_.preventDefault();
                document.removeEventListener('mousemove', _dragDialog_);
                document.removeEventListener('touchmove', _dragDialog_);
                document.removeEventListener('mouseup', dragDialog_);
                document.removeEventListener('touchend', dragDialog_);
            }
        }
    });
}
// 初始化手势
function init_gestures() {
    var gesture_lastDistance = 0, gesture_lastPoint = { x: 0, y: 0 }, gesture_translating = false;
    canvas.on('mouse:down', _gestureAct);
    canvas.on('mouse:move', _gestureAct_);
    canvas.on('mouse:up', gestureAct_);
    // 触摸按下
    function _gestureAct(e) {
        if (e.e.type !== 'touchstart' || e.e.touches.length < 2 || currentPenMode !== 'pen') return; // 仅在笔模式下操作
        gesture_lastDistance = 0;
        gesture_lastPoint = { x: 0, y: 0 };
        gesture_translating = true; // 标记手势操作开始
        canvas.isDrawingMode = false; // 阻止画笔绘制
        // 获取触摸点
        var p0 = { x: e.e.touches[0].clientX, y: e.e.touches[0].clientY };
        var p1 = { x: e.e.touches[1].clientX, y: e.e.touches[1].clientY };
        // 获取两点距离与中点坐标
        gesture_lastDistance = Math.sqrt(Math.pow(p1.x - p0.x, 2) + Math.pow(p1.y - p0.y, 2));
        gesture_lastPoint = { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 };
    }
    // 触摸移动
    function _gestureAct_(e) {
        if (!gesture_translating || e.e.type !== 'touchmove') return;
        if (e.e.touches.length == 2) {
            // 双指缩放
            var p0 = { x: e.e.touches[0].clientX, y: e.e.touches[0].clientY };
            var p1 = { x: e.e.touches[1].clientX, y: e.e.touches[1].clientY };
            var distance = Math.sqrt(Math.pow(p1.x - p0.x, 2) + Math.pow(p1.y - p0.y, 2));
            var gesture_scale = canvas.viewportTransform[0] * distance / gesture_lastDistance; // 计算缩放比例
            gesture_lastDistance = distance;
            gesture_lastPoint = { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 };
            canvas.zoomToPoint(gesture_lastPoint, gesture_scale); // 关于中点缩放
            vpt[currentPage] = canvas.viewportTransform; // 记录缩放状态
        } else if (e.e.touches.length >= 3) {
            // 多指平移
            var p0 = { x: e.e.touches[0].clientX, y: e.e.touches[0].clientY };
            var p1 = { x: e.e.touches[1].clientX, y: e.e.touches[1].clientY };
            var gesture_translate = { x: (p0.x + p1.x) / 2 - gesture_lastPoint.x, y: (p1.y + p0.y) / 2 - gesture_lastPoint.y }; // 计算平移距离
            gesture_lastPoint = { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 };
            // 执行平移操作
            canvas.viewportTransform[4] += gesture_translate.x;
            canvas.viewportTransform[5] += gesture_translate.y;
            vpt[currentPage] = canvas.viewportTransform; // 记录平移状态
            canvas.requestRenderAll(); // 刷新画布，否则画面不会更新
        }
    }
    // 触摸抬起
    function gestureAct_(e) {
        if (!gesture_translating || e.e.type !== 'touchend') return;
        canvas.isDrawingMode = true;
        gesture_lastDistance = 0;
        gesture_lastPoint = { x: 0, y: 0 };
        gesture_translating = false;
    }
}
// 初始化拖放功能（拖放导入图片）
function init_dragdrop() {
    // 悬浮
    document.addEventListener('dragover', function (e) {
        e.preventDefault();
        if (e.target !== canvas.upperCanvasEl) return; // 只处理画布区域内的拖放事件
        this.documentElement.querySelector('.dialog-dropTip').classList.add('dialog-open');
    });
    // 放下
    document.addEventListener('drop', function (e) {
        e.preventDefault();
        if (e.target !== canvas.upperCanvasEl) return;
        var files = e.dataTransfer.files;
        if (files.length > 0) {
            for (var i = 0; i < files.length; i++) {
                var file = files[i];
                if (file.type.indexOf('image') !== -1) {
                    insertImage(file);
                }
            }
        }
        this.documentElement.querySelector('.dialog-dropTip').classList.remove('dialog-open');
    });
    // 拖离
    document.addEventListener('dragleave', function (e) {
        e.preventDefault();
        if (e.target !== canvas.upperCanvasEl) return;
        this.documentElement.querySelector('.dialog-dropTip').classList.remove('dialog-open');
    });
}
// 初始化粘贴图片功能
function init_paste() {
    document.addEventListener('paste', function (e) {
        e.preventDefault();
        var items = e.clipboardData.items;
        for (var i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                var file = items[i].getAsFile();
                insertImage(file);
            }
        }
    });
}
// 初始化 socket.io 连接
function init_socket() {
    var lastTimestamp = -1;
    var socket = io();
    var socket_inited = false;
    // 接收画布数据
    socket.on('canvasData', function (data) {
        if (data.client_code === client_code || data.timestamp <= lastTimestamp) return; // 忽略其它客户端的数据和过时的数据
        lastTimestamp = data.timestamp; // 更新时间戳，用于判断是否是最新数据
        var reloadCurrentPage = false;
        if (typeof (data.page) === 'number') { // 包含 page 字段的数据来自其它客户端，不包含的为初始化数据
            pages[data.page] = data.data;
            // 判断是否刷新当前页面
            if (data.page === currentPage) {
                reloadCurrentPage = true;
            }
            console.log('socket:receive');
        } else {
            if (socket_inited) return; // 只初始化一次
            pages = JSON.parse(data.data);
            reloadCurrentPage = true;
            socket_inited = true;
            console.log('socket:init');
        }
        // 刷新当前页面
        if (reloadCurrentPage) {
            if (typeof (pages[currentPage]) === 'undefined') return;
            // 暂停惭怍记录
            recordingState = false;
            canvas.loadFromJSON(pages[currentPage]);
            setTimeout(() => {
                // 恢复惭怍记录
                recordingState = true;
                handleCanvasChange({ post: false });
                // 用一些奇怪的方法更新画布（）
                // 千万别用橡皮擦
                if (currentPenMode === 'eraser') {
                    setPenMode('pen');
                    selectAll();
                    canvas.discardActiveObject();
                    setPenMode('eraser');
                } else {
                    selectAll();
                    canvas.discardActiveObject();
                }
            }, 10);
        }
        console.log(data);
        updatePageInfo({ clearStack: false });
    });
    // 监听网络更改
    var interval_hideNetStatus;
    socket.on('connect', function () {
        socket.emit('getCanvasData'); // 连接时自动请求画布数据
        document.querySelector('.icon-netStatus-online').style.display = 'inline-block';
        document.querySelector('.icon-netStatus-offline').style.display = 'none';
        document.querySelector('.text-netStatus').textContent = "Socket 连接成功";
        clearInterval(interval_hideNetStatus); // 清除之前的定时器
        document.querySelector('.dialog-netStatus').classList.add('dialog-fixed'); // 使用 fixed 而不是 open，避免与其它对话框相互影响
        // 延时关闭对话框
        interval_hideNetStatus = setInterval(function () {
            document.querySelector('.dialog-netStatus').classList.remove('dialog-fixed');
        }, 3000);
        console.log('socket:connect');
    });
    socket.on('disconnect', function () {
        document.querySelector('.icon-netStatus-online').style.display = 'none';
        document.querySelector('.icon-netStatus-offline').style.display = 'inline-block';
        document.querySelector('.text-netStatus').textContent = "Socket 连接断开";
        clearInterval(interval_hideNetStatus);
        document.querySelector('.dialog-netStatus').classList.add('dialog-fixed');
        interval_hideNetStatus = setInterval(function () {
            document.querySelector('.dialog-netStatus').classList.remove('dialog-fixed');
        }, 3000);
        console.log('socket:disconnect');
    });
}
// 初始化其他功能
function init_others() {
    // 更新按钮禁用状态
    updateBtnAvai();
    // 监听形状绘制事件
    shapeOverlay.addEventListener("mousedown", _drawShape);
    shapeOverlay.addEventListener("touchstart", _drawShape);
    shapeOverlay.addEventListener("mousemove", _drawShape_);
    shapeOverlay.addEventListener("touchmove", _drawShape_);
    shapeOverlay.addEventListener("mouseup", drawShape_);
    shapeOverlay.addEventListener("touchend", drawShape_);
}
// 画笔部分
// 设置画笔模式
var currentPenMode;
function setPenMode(mode) {
    document.querySelectorAll('.penMode').forEach(function (element) {
        element.classList.remove('toolbar-item-active');
    });
    document.querySelector('.penMode-' + mode).classList.add('toolbar-item-active');
    if (mode === 'selector') {
        closeAllDialogs();
        canvas.isDrawingMode = false;
    } else if (mode === 'pen') {
        closeAllDialogs('.dialog-penOptions');
        canvas.isDrawingMode = true;
        // 取消选择
        canvas.discardActiveObject();
        canvas.renderAll();
    } else if (mode === 'eraser') {
        closeAllDialogs('.dialog-clearAll');
        canvas.isDrawingMode = false;
        // 取消选择
        canvas.discardActiveObject();
        canvas.renderAll();
    }
    // 附加功能 / 二级菜单
    if (currentPenMode === 'selector' && mode === 'selector') {
        // 全选
        selectAll();
    } else if (currentPenMode === 'pen' && mode === 'pen') {
        // 画布参数
        toggleDialog('.dialog-penOptions', { autoPos: true });
    } else if (currentPenMode === 'eraser' && mode === 'eraser') {
        // 全部擦除
        toggleDialog('.dialog-clearAll', { autoPos: true });
    }
    currentPenMode = mode;
}
// 设置画笔颜色（Hex）
function setPenColor(color) {
    var rgba = "rgba(" + hexToRGB(color).join() + "," + penOpacity + ")";
    canvas.freeDrawingBrush.color = rgba;
    canvas.renderAll();
    updatePenPreview();
}
// 设置画笔透明度
var penOpacity = 1;
function setPenOpacity(opacity) {
    // 分别处理两种颜色格式
    if (canvas.freeDrawingBrush.color.includes('rgba')) {
        var rgba = "rgba(" + convertedRGB.join() + "," + opacity + ")";
    } else {
        var rgba = "rgba(" + hexToRGB(canvas.freeDrawingBrush.color).join() + "," + opacity + ")";
    }
    penOpacity = opacity;
    canvas.freeDrawingBrush.color = rgba;
    canvas.renderAll();
    updatePenPreview();
}
// 设置画笔大小
function setPenSize(size) {
    size = size * 1;
    canvas.freeDrawingBrush.width = size;
    canvas.renderAll();
    updatePenPreview({ isSizeChange: true });
}
// 设置画笔预设
function setPenPreset(preset) {
    if (preset === 'default') {
        canvas.freeDrawingBrush.color = '#ffffff';
        canvas.freeDrawingBrush.width = 2;
        canvas.freeDrawingBrush.strokeDashArray = null;
        canvas.freeDrawingBrush.shadow = null;
        document.querySelector('.input-penOpacity').value = 1;
        document.querySelector('.input-penSize').value = 2;
        penOpacity = 1;
        updatePenPreview();
    } else if (preset === 'highlighter') {
        canvas.freeDrawingBrush.color = '#ffff71';
        canvas.freeDrawingBrush.width = 20;
        canvas.freeDrawingBrush.strokeDashArray = null;
        canvas.freeDrawingBrush.shadow = null;
        document.querySelector('.input-penOpacity').value = 0.5;
        document.querySelector('.input-penSize').value = 20;
        setPenOpacity(0.5);
        updatePenPreview();
    } else if (preset === 'dash') {
        canvas.freeDrawingBrush.color = '#ffffff';
        canvas.freeDrawingBrush.width = 2;
        canvas.freeDrawingBrush.strokeDashArray = [10, 10];
        canvas.freeDrawingBrush.shadow = null;
        document.querySelector('.input-penOpacity').value = 1;
        document.querySelector('.input-penSize').value = 2;
        penOpacity = 1;
        updatePenPreview();
    } else if (preset === 'shadow') {
        canvas.freeDrawingBrush.color = '#ffffff';
        canvas.freeDrawingBrush.width = 2;
        canvas.freeDrawingBrush.strokeDashArray = null;
        canvas.freeDrawingBrush.shadow = new fabric.Shadow({
            blur: 10,
            offsetX: 5,
            offsetY: 5,
            color: '#ffffff'
        });
        document.querySelector('.input-penOpacity').value = 1;
        document.querySelector('.input-penSize').value = 2;
        penOpacity = 1;
        updatePenPreview();
    }
    document.querySelector('.dialog-penOptions').classList.remove('dialog-open');
}
// 更新画笔预览
function updatePenPreview(options = { isSizeChange: false }) {
    var preview = document.querySelector('.penPreview');
    var color = canvas.freeDrawingBrush.color;
    preview.style.backgroundColor = color;
    if (options.isSizeChange) {
        var size = canvas.freeDrawingBrush.width;
        preview.style.transform = "scale(" + size / 25 + ")";
    }
}
// 对话框部分
// 打开 / 关闭对话框
function toggleDialog(selector, options = { autoPos: false }) {
    const dialog = document.querySelector(selector);
    dialog.classList.toggle('dialog-open');
    if (options.autoPos) {
        if (dialog.classList.contains('dialog-fixed')) {
            // 自动取消固定
            fixDialog(selector);
        } else if (dialog.classList.contains('dialog-open')) {
            // 定位对话框
            dialog.style.left = lastX + 'px';
        }
    }
}
// 跟踪鼠标（用于定位对话框）
var lastX;
// 关闭所有对话框
function closeAllDialogs(exception) {
    document.querySelectorAll('.dialog-open').forEach(function (dialog) {
        if (dialog === document.querySelector(exception)) return;
        dialog.classList.remove('dialog-open');
    });
}
// 固定对话框
function fixDialog(selector, fix = false) { // fix 为 true 表示始终固定对话框，为 false 表示切换固定状态
    const dialog = document.querySelector(selector);
    const icon = document.querySelector(selector + ' .dialog-btn-icon img');
    if (dialog.classList.contains('dialog-fixed') && !fix) {
        dialog.classList.remove('dialog-fixed', 'dialog-open');
        setTimeout(() => {
            dialog.style.bottom = '64px';
            icon.src = "/static/icons/arrow_outward.svg";
        }, 200);
    } else {
        dialog.classList.add('dialog-fixed');
        icon.src = "/static/icons/close.svg";
    }
}
// 操作记录部分
var actionStack = [];
var actionPointer = -1;
var recordingState = true;
// 保存画布状态
function handleCanvasChange(options = { post: true }) {
    // 更新按钮禁用状态
    updateBtnAvai();
    var data = JSON.stringify(canvas);
    if (data === actionStack[actionPointer] || !recordingState) return;
    // 以下操作仅在符合条件时执行
    // 写入操作栈
    actionStack.splice(actionPointer + 1);
    actionStack.push(data);
    actionPointer++;
    // 限制操作栈长度
    if (actionPointer > 99) {
        actionStack.shift();
        actionPointer--;
    }
    // 保存多页面
    pages[currentPage] = data;
    if (options.post) {
        // 发送画布数据
        postCanvasData();
    }
    // 由于上面更新了操作栈，需要再次更新按钮禁用状态
    updateBtnAvai();
}
// 撤销
function undo() {
    if (actionPointer <= 0) return;
    actionPointer--;
    recordingState = false; // 撤销与重做不入栈
    canvas.loadFromJSON(actionStack[actionPointer], function () {
        canvas.renderAll();
    });
    // 用一些奇怪的方法更新画布（）
    setTimeout(() => {
        recordingState = true;
        resizeCanvas();
        // 保存多页面
        pages[currentPage] = JSON.stringify(canvas);
        postCanvasData();
    }, 10); // 设置延时，留出时间加载图片
    (function () {
        resizeCanvas();
    })();
}
// 重做
function redo() {
    if (actionPointer >= actionStack.length - 1) return;
    actionPointer++;
    recordingState = false;
    canvas.loadFromJSON(actionStack[actionPointer], function () {
        canvas.renderAll();
    });
    setTimeout(() => {
        recordingState = true;
        resizeCanvas();
        // 保存多页面
        pages[currentPage] = JSON.stringify(canvas);
        postCanvasData();
    }, 10);
    (function () {
        resizeCanvas();
    })();
}
// 多页面部分
var pages = [];
var vpt = [];
var currentPage = 0;
// 上一页
function prevPage() {
    if (currentPage <= 0) return;
    // 暂停操作记录
    recordingState = false;
    currentPage--;
    canvas.loadFromJSON(pages[currentPage], function () {
        canvas.renderAll();
        canvas.viewportTransform = vpt[currentPage] ? vpt[currentPage] : [1, 0, 0, 1, 0, 0];
    });
    // 用一些奇怪的方法更新画布（）
    setTimeout(() => {
        resizeCanvas();
        // 恢复操作记录
        recordingState = true;
        handleCanvasChange({ post: false });
    }, 10); // 设置延时，留出时间加载图片
    (function () {
        resizeCanvas();
    })();
    updatePageInfo();
}
// 下一页 / 新建页
function nextPage() {
    if (currentPage >= pages.length - 1) {
        pages.push('{"version":"6.6.2","objects":[],"background":"#1e272c"}');
        postNewPage(); // 发送新页面
    }
    recordingState = false;
    currentPage++;
    canvas.loadFromJSON(pages[currentPage], function () {
        canvas.renderAll();
        canvas.viewportTransform = vpt[currentPage] ? vpt[currentPage] : [1, 0, 0, 1, 0, 0];
    });
    setTimeout(() => {
        resizeCanvas();
        recordingState = true;
        handleCanvasChange({ post: false });
    }, 10);
    (function () {
        resizeCanvas();
    })();
    updatePageInfo();
}
// 更新页面信息（页码、操作栈与按钮状态）
function updatePageInfo(options = { clearStack: true }) {
    // 更新页码
    var pageNum = document.querySelector('.pageNum');
    pageNum.innerHTML = currentPage + 1 + ' / ' + pages.length;
    setTimeout(() => {
        // 翻页时清空操作栈
        if (options.clearStack) {
            actionStack = [JSON.stringify(canvas)];
            actionPointer = 0;
        }
        updateBtnAvai();
    }, 10);
}
// 形状绘制部分
var drawingShape;
var drawingShapeOptions;
var drawingShapeObj;
var shapeOverlay = document.querySelector('.shape-overlay');
var shapeTipDialog = document.querySelector('.dialog-shapeTip');
var shapeTipIcon = document.querySelector('.icon-shapeTip');
var shapeReference = document.querySelector('.shape-reference');
// 绘制前的准备
function drawShape(shape, options = null) {
    drawingShape = shape;
    drawingShapeOptions = options;
    shapeOverlay.style.pointerEvents = "all"; // 监听绘制遮罩层，而不是画布
    closeAllDialogs();
    if (shape === 'arrow' && options && options.double) {
        shapeTipIcon.src = "/static/icons/shape-arrow_double.svg";
    } else {
        shapeTipIcon.src = "/static/icons/shape-" + shape + ".svg";
    }
    if (currentPenMode !== 'pen') {
        setPenMode('pen');
    }
    toggleDialog('.dialog-shapeTip');
}
// 鼠标按下，创建形状对象
function _drawShape(e) {
    e.preventDefault();
    closeAllDialogs();
    canvas.discardActiveObject();
    recordingState = false; // 防止形状绘制过程中触发操作记录
    var ox = e.clientX || e.touches[0].clientX;
    var oy = e.clientY || e.touches[0].clientY;
    // 根据画布缩放与平移调整坐标
    var x = (ox - canvas.viewportTransform[4]) / canvas.viewportTransform[0];
    var y = (oy - canvas.viewportTransform[5]) / canvas.viewportTransform[3];
    switch (drawingShape) {
        case 'line':
            drawingShapeObj = new fabric.Line([x, y, x, y], {
                stroke: canvas.freeDrawingBrush.color,
                strokeWidth: canvas.freeDrawingBrush.width,
                strokeDashArray: canvas.freeDrawingBrush.strokeDashArray,
                shadow: canvas.freeDrawingBrush.shadow
            });
            break;
        case 'arrow':
            // 带箭头的线段，需要用 Group 进行组合
            var size = canvas.freeDrawingBrush.width;
            var line = new fabric.Line([0, 0, 0, 0], {
                stroke: canvas.freeDrawingBrush.color,
                strokeWidth: size,
                strokeDashArray: canvas.freeDrawingBrush.strokeDashArray,
                shadow: canvas.freeDrawingBrush.shadow
            });
            var arrow = new fabric.Triangle({
                width: Math.log(size + 1) * 15,
                height: Math.log(size + 1) * 15,
                left: size / 2,
                angle: 180,
                fill: canvas.freeDrawingBrush.color
            });
            // 这里将单箭头线段和双箭头线段合并，再用 options 参数区分
            if (drawingShapeOptions && drawingShapeOptions.double) {
                var arrow_2 = new fabric.Triangle({
                    width: Math.log(size + 1) * 15,
                    height: Math.log(size + 1) * 15,
                    left: -Math.log(size + 2) * 12,
                    fill: canvas.freeDrawingBrush.color
                });
                drawingShapeObj = new fabric.Group([line, arrow, arrow_2], {
                    left: x,
                    top: y
                });
            } else {
                drawingShapeObj = new fabric.Group([line, arrow], {
                    left: x,
                    top: y
                });
            }
            break;
        case 'rect':
            drawingShapeObj = new fabric.Rect({
                left: x,
                top: y,
                width: 0,
                height: 0,
                stroke: canvas.freeDrawingBrush.color,
                strokeWidth: canvas.freeDrawingBrush.width,
                fill: '',
                strokeDashArray: canvas.freeDrawingBrush.strokeDashArray,
                shadow: canvas.freeDrawingBrush.shadow
            });
            break;
        case 'circle':
            drawingShapeObj = new fabric.Circle({
                left: x,
                top: y,
                radius: 0,
                stroke: canvas.freeDrawingBrush.color,
                strokeWidth: canvas.freeDrawingBrush.width,
                fill: '',
                strokeDashArray: canvas.freeDrawingBrush.strokeDashArray,
                shadow: canvas.freeDrawingBrush.shadow,
                originX: 'center',
                originY: 'center'
            });
            break;
        case 'triangle':
            drawingShapeObj = new fabric.Triangle({
                left: x,
                top: y,
                width: 0,
                height: 0,
                stroke: canvas.freeDrawingBrush.color,
                strokeWidth: canvas.freeDrawingBrush.width,
                fill: '',
                strokeDashArray: canvas.freeDrawingBrush.strokeDashArray,
                shadow: canvas.freeDrawingBrush.shadow
            });
            break;
        case 'rightTriangle':
            // 部分形状 Fabric.js 没有内置，需要用到多边形
            _drawPolygon(e, Array(3).fill({ x: x, y: y }));
            break;
        case 'rhombus':
            _drawPolygon(e, Array(4).fill({ x: x, y: y }));
            break;
        case 'pentagon':
            _drawPolygon(e, Array(5).fill({ x: x, y: y }));
            break;
        case 'hexagon':
            _drawPolygon(e, Array(6).fill({ x: x, y: y }));
            break;
        case 'octagon':
            _drawPolygon(e, Array(8).fill({ x: x, y: y }));
            break;
        case 'star':
            _drawPolygon(e, Array(10).fill({ x: x, y: y }));
            break;
        default:
            break;
    }
    canvas.add(drawingShapeObj);
    canvas.bringObjectToFront(drawingShapeObj);
    canvas.renderAll();
    shapeReference.style.left = ox + "px";
    shapeReference.style.top = oy + "px";
}
// 鼠标移动，调整形状大小
function _drawShape_(e) {
    if (!drawingShapeObj) return;
    e.preventDefault();
    var ox = e.clientX || e.touches[0].clientX;
    var oy = e.clientY || e.touches[0].clientY;
    var x = (ox - canvas.viewportTransform[4]) / canvas.viewportTransform[0];
    var y = (oy - canvas.viewportTransform[5]) / canvas.viewportTransform[3];
    var width = x - drawingShapeObj.left;
    var height = y - drawingShapeObj.top;
    switch (drawingShape) {
        case 'line':
            drawingShapeObj.set({
                x2: x,
                y2: y
            });
            break;
        case 'arrow':
            var d = Math.sqrt(Math.pow(x - drawingShapeObj.left, 2) + Math.pow(y - drawingShapeObj.top, 2));
            var angle = Math.atan2(y - drawingShapeObj.top, x - drawingShapeObj.left) * 180 / Math.PI - 90;
            var arrowSize = Math.log(canvas.freeDrawingBrush.width + 1) * 15;
            drawingShapeObj.getObjects()[0].set({ y1: -d / 2, y2: d / 2 - arrowSize });
            drawingShapeObj.getObjects()[1].set({ top: d / 2 });
            if (drawingShapeObj.getObjects().length === 3) {
                drawingShapeObj.getObjects()[2].set({ top: -d / 2 });
                drawingShapeObj.getObjects()[0].set({ y1: -d / 2 + arrowSize, y2: d / 2 - arrowSize });
            }
            drawingShapeObj.set({
                width: arrowSize,
                height: d,
                originX: 'center',
                originY: 'top',
                angle: angle
            });
            break;
        case 'rect':
            drawingShapeObj.set({
                width: Math.abs(width),
                height: Math.abs(height),
                // 允许翻转
                originX: x < drawingShapeObj.left ? 'right' : 'left',
                originY: y < drawingShapeObj.top ? 'bottom' : 'top'
            });
            break;
        case 'circle':
            var radius = Math.sqrt(Math.pow(x - drawingShapeObj.left, 2) + Math.pow(y - drawingShapeObj.top, 2));
            drawingShapeObj.set({
                radius: radius
            });
            break;
        case 'triangle':
            drawingShapeObj.set({
                width: Math.abs(width),
                height: Math.abs(height),
                originX: x < drawingShapeObj.left ? 'right' : 'left',
                originY: y < drawingShapeObj.top ? 'bottom' : 'top'
            });
            break;
        case 'rightTriangle':
            _drawPolygon_(e, [{ x: polygonOrigin[0], y: y }, { x: x, y: y }, { x: polygonOrigin[0], y: polygonOrigin[1] }]);
            break;
        case 'rhombus':
            _drawPolygon_(e, [
                { x: polygonOrigin[0] + 22 / 24 * width, y: polygonOrigin[1] + 12 / 24 * height },
                { x: polygonOrigin[0] + 12 / 24 * width, y: polygonOrigin[1] + 2 / 24 * height },
                { x: polygonOrigin[0] + 2 / 24 * width, y: polygonOrigin[1] + 12 / 24 * height },
                { x: polygonOrigin[0] + 12 / 24 * width, y: polygonOrigin[1] + 22 / 24 * height }
            ]);
            break;
        case 'pentagon':
            _drawPolygon_(e, [
                { x: polygonOrigin[0] + 21.51 / 24 * width, y: polygonOrigin[1] + 9.86 / 24 * height },
                { x: polygonOrigin[0] + 17.88 / 24 * width, y: polygonOrigin[1] + 21.05 / 24 * height },
                { x: polygonOrigin[0] + 6.12 / 24 * width, y: polygonOrigin[1] + 21.05 / 24 * height },
                { x: polygonOrigin[0] + 2.49 / 24 * width, y: polygonOrigin[1] + 9.86 / 24 * height },
                { x: polygonOrigin[0] + 12 / 24 * width, y: polygonOrigin[1] + 2.96 / 24 * height }
            ]);
            break;
        case 'hexagon':
            _drawPolygon_(e, [
                { x: polygonOrigin[0] + 22 / 24 * width, y: polygonOrigin[1] + 12 / 24 * height },
                { x: polygonOrigin[0] + 17 / 24 * width, y: polygonOrigin[1] + 3.34 / 24 * height },
                { x: polygonOrigin[0] + 7 / 24 * width, y: polygonOrigin[1] + 3.34 / 24 * height },
                { x: polygonOrigin[0] + 2 / 24 * width, y: polygonOrigin[1] + 12 / 24 * height },
                { x: polygonOrigin[0] + 7 / 24 * width, y: polygonOrigin[1] + 20.66 / 24 * height },
                { x: polygonOrigin[0] + 17 / 24 * width, y: polygonOrigin[1] + 20.66 / 24 * height }
            ]);
            break;
        case 'octagon':
            _drawPolygon_(e, [
                { x: polygonOrigin[0] + 21.24 / 24 * width, y: polygonOrigin[1] + 15.83 / 24 * height },
                { x: polygonOrigin[0] + 21.24 / 24 * width, y: polygonOrigin[1] + 8.17 / 24 * height },
                { x: polygonOrigin[0] + 15.83 / 24 * width, y: polygonOrigin[1] + 2.76 / 24 * height },
                { x: polygonOrigin[0] + 8.17 / 24 * width, y: polygonOrigin[1] + 2.76 / 24 * height },
                { x: polygonOrigin[0] + 2.76 / 24 * width, y: polygonOrigin[1] + 8.17 / 24 * height },
                { x: polygonOrigin[0] + 2.76 / 24 * width, y: polygonOrigin[1] + 15.83 / 24 * height },
                { x: polygonOrigin[0] + 8.17 / 24 * width, y: polygonOrigin[1] + 21.24 / 24 * height },
                { x: polygonOrigin[0] + 15.83 / 24 * width, y: polygonOrigin[1] + 21.24 / 24 * height }
            ]);
            break;
        case 'star':
            _drawPolygon_(e, [
                { x: polygonOrigin[0] + 12 / 24 * width, y: polygonOrigin[1] + 2.49 / 24 * height },
                { x: polygonOrigin[0] + 15.09 / 24 * width, y: polygonOrigin[1] + 8.75 / 24 * height },
                { x: polygonOrigin[0] + 22 / 24 * width, y: polygonOrigin[1] + 9.76 / 24 * height },
                { x: polygonOrigin[0] + 17 / 24 * width, y: polygonOrigin[1] + 14.63 / 24 * height },
                { x: polygonOrigin[0] + 18.18 / 24 * width, y: polygonOrigin[1] + 21.51 / 24 * height },
                { x: polygonOrigin[0] + 12 / 24 * width, y: polygonOrigin[1] + 18.26 / 24 * height },
                { x: polygonOrigin[0] + 5.82 / 24 * width, y: polygonOrigin[1] + 21.51 / 24 * height },
                { x: polygonOrigin[0] + 7 / 24 * width, y: polygonOrigin[1] + 14.63 / 24 * height },
                { x: polygonOrigin[0] + 2 / 24 * width, y: polygonOrigin[1] + 9.76 / 24 * height },
                { x: polygonOrigin[0] + 8.91 / 24 * width, y: polygonOrigin[1] + 8.75 / 24 * height }
            ]);
            break;
        default:
            break;
    }
    canvas.renderAll();
    // 长宽近似相等时显示提示框
    if (drawingShape === 'line') {
        // 直线不同于其他形状，需要单独处理
        // 此处需要还原画布缩放
        var width_line = (drawingShapeObj.x2 - drawingShapeObj.x1) * canvas.viewportTransform[0];
        var height_line = (drawingShapeObj.y2 - drawingShapeObj.y1) * canvas.viewportTransform[3];
        if (Math.abs(width_line) > Math.abs(height_line) - 4 && Math.abs(width_line) < Math.abs(height_line) + 4) {
            shapeReference.style.opacity = 1;
            shapeReference.style.width = Math.abs(width_line) + "px";
            shapeReference.style.height = Math.abs(height_line) + "px";
            shapeReference.style.transform = `scale(${width_line > 0 ? 1 : -1}, ${height_line > 0 ? 1 : -1})`;
        } else {
            shapeReference.style.opacity = 0;
        }
    } else if (drawingShape !== 'circle') { // 圆无需处理
        if (Math.abs(width) > Math.abs(height) - 4 / canvas.viewportTransform[0] && Math.abs(width) < Math.abs(height) + 4 / canvas.viewportTransform[0]) {
            shapeReference.style.opacity = 1;
            shapeReference.style.width = Math.abs(width * canvas.viewportTransform[0]) + "px";
            shapeReference.style.height = Math.abs(height * canvas.viewportTransform[3]) + "px";
            shapeReference.style.transform = `scale(${width > 0 ? 1 : -1}, ${height > 0 ? 1 : -1})`;
        } else {
            shapeReference.style.opacity = 0;
        }
    }
}
// 鼠标抬起，结束绘制
function drawShape_(e) {
    e.preventDefault();
    ['rightTriangle', 'rhombus', 'pentagon', 'hexagon', 'octagon', 'star'].forEach(function (shape) {
        if (drawingShape === shape) {
            drawPolygon_(e);
        }
    });
    shapeOverlay.style.pointerEvents = "none";
    drawingShapeObj = null; // 防止再次绘制时改变上一次绘制的形状
    setTimeout(() => {
        recordingState = true;
        // 用一些奇怪的方法更新画布（）
        selectAll();
        canvas.discardActiveObject();
        // 记录操作
        handleCanvasChange();
    }, 10);
    shapeReference.style.opacity = 0;
}
// 绘制多边形（用于绘制 Fabric.js 中没有提供的形状）
var polygonOrigin = [];
var polygonSize = [];
function _drawPolygon(e, points) {
    var ox = e.clientX || e.touches[0].clientX;
    var oy = e.clientY || e.touches[0].clientY;
    x = (ox - canvas.viewportTransform[4]) / canvas.viewportTransform[0];
    y = (oy - canvas.viewportTransform[5]) / canvas.viewportTransform[3];
    polygonOrigin = [x, y];
    drawingShapeObj = new fabric.Polygon(points, {
        stroke: canvas.freeDrawingBrush.color,
        strokeWidth: canvas.freeDrawingBrush.width,
        fill: '',
        strokeDashArray: canvas.freeDrawingBrush.strokeDashArray,
        shadow: canvas.freeDrawingBrush.shadow
    });
}
function _drawPolygon_(e, points) {
    var ox = e.clientX || e.touches[0].clientX;
    var oy = e.clientY || e.touches[0].clientY;
    x = (ox - canvas.viewportTransform[4]) / canvas.viewportTransform[0];
    y = (oy - canvas.viewportTransform[5]) / canvas.viewportTransform[3];
    var width = Math.abs(x - polygonOrigin[0]);
    var height = Math.abs(y - polygonOrigin[1]);
    polygonSize = [width, height];
    drawingShapeObj.set({
        points: points,
        // 此处将宽度和高度乘 2，以防翻转（向左/上方绘制）时形状溢出导致显示不全
        width: width * 2,
        height: height * 2,
        originX: 'center',
        originY: 'center'
    });
}
function drawPolygon_() {
    var width = polygonSize[0];
    var height = polygonSize[1];
    // 恢复形状的原有大小
    drawingShapeObj.set({
        width: width,
        height: height,
    });
    // 校正形状位置
    if (x > polygonOrigin[0]) {
        drawingShapeObj.set({
            left: polygonOrigin[0] + width / 2,
        });
    } else {
        drawingShapeObj.set({
            left: polygonOrigin[0] - width / 2,
        });
    }
    if (y > polygonOrigin[1]) {
        drawingShapeObj.set({
            top: polygonOrigin[1] + height / 2,
        });
    } else {
        drawingShapeObj.set({
            top: polygonOrigin[1] - height / 2,
        });
    }
    // 用一些奇怪的方法更新画布（）
    canvas.loadFromJSON(JSON.stringify(canvas));
}
// 网络部分
// 发送画布数据
var client_code = generateRandomCode(8); // 生成 8 位随机代码，作为客户端代号
function postCanvasData() {
    if (String(pages) === '{"version":"6.6.2","objects":[],"background":"#1e272c"}') return; // 忽略空白画布
    let xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/postCanvasData');
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify({ page: currentPage, data: JSON.stringify(canvas), client_code: client_code }));
    console.log('socket:post');
}
// 发送新页面
function postNewPage() {
    let xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/newPage');
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send();
    console.log('socket:post');
}
// 其它部分
// 调整样式
function setStyle(options) {
    // 处理简化的阴影参数
    if (typeof (options.shadow) === 'string') {
        options.shadow = new fabric.Shadow({
            color: options.shadow,
            blur: 10,
            offsetX: 5,
            offsetY: 5
        });
    }
    var objects = getActiveObjects();
    objects.forEach(function (obj) {
        obj.set(options);
    });
    canvas.renderAll();
    handleCanvasChange();
    // 用一些奇怪的方法更新画布（）
    canvas.discardActiveObject();
    const activeSelection = new fabric.ActiveSelection(objects, {
        canvas: canvas
    });
    canvas.setActiveObject(activeSelection);
    canvas.requestRenderAll();
}
// 图层操作
function changeLayer(layer) {
    switch (layer) {
        case 'up':
            getActiveObjects().forEach(function (obj) {
                canvas.bringObjectForward(obj);
            });
            break;
        case 'down':
            getActiveObjects().forEach(function (obj) {
                canvas.sendObjectBackwards(obj);
            });
            break;
        case 'top':
            getActiveObjects().forEach(function (obj) {
                canvas.bringObjectToFront(obj);
            });
            break;
        case 'bottom':
            getActiveObjects().forEach(function (obj) {
                canvas.sendObjectToBack(obj);
            });
            break;
        default:
            break;
    }
    canvas.discardActiveObject();
    canvas.requestRenderAll();
    handleCanvasChange(); // 由于 Fabric.js 更改图层后不会自动触发事件，此处需单独记录操作
    closeAllDialogs();
}
// 复制对象
var clipboard;
function copyObj() {
    // 获取选中对象，初始化克隆数据
    clipboard = [];
    var objects = getActiveObjects();
    // 逐个克隆并加入克隆组
    objects.forEach(function (obj) {
        // 实测 clone() 方法会返回一个 Promise 对象，需要用 then 方法获取克隆对象
        var obj_clone_promise = obj.clone();
        obj_clone_promise.then(result => clipboard.push(result));
    });
    setTimeout(() => {
        // 调整对象位置，防止溢出画布
        var adjust = false;
        // 只要有一个对象溢出画布，就调整所有对象（防止错位）
        clipboard.forEach(function (obj) {
            if ((obj.left <= obj.width / 2 || obj.top <= obj.height / 2) && obj.left + canvas.width / 2 + obj.width < canvas.width && obj.top + canvas.height / 2 + obj.height < canvas.height) {
                adjust = true;
            }
        });
        clipboard.forEach(function (obj) {
            if (adjust) {
                obj.set({
                    left: obj.left + canvas.width / 2,
                    top: obj.top + canvas.height / 2
                });
            } else {
                obj.set({
                    left: obj.left + 10,
                    top: obj.top + 10
                });
            }
        });
    }, 0);
    // 允许粘贴
    document.querySelector('.btn-paste').classList.remove('grid-item-disabled');
}
// 粘贴对象
function pasteObj() {
    // 避免在橡皮擦模式下粘贴
    if (currentPenMode === 'eraser') {
        setPenMode('pen');
    }
    // 暂停操作记录
    recordingState = false;
    // 如果剪贴板包含图片或阴影，则粘贴后不选中它们
    var clipboard_processed = [];
    // 遍历剪贴板，逐个粘贴
    clipboard.forEach(function (obj) {
        // 此处仍使用克隆操作
        var obj_clone_promise = obj.clone();
        obj_clone_promise.then(result => canvas.add(result));
        // 检测图片和阴影
        if (!(obj instanceof fabric.Image) && obj.shadow === null) {
            clipboard_processed.push(obj);
        }
    });
    if (clipboard.length === clipboard_processed.length) { // 仅在没有图片的情况下更新画布，避免图片消失
        // 用一些奇怪的方法更新画布（）
        canvas.loadFromJSON(JSON.stringify(canvas));
    }
    setTimeout(() => {
        if (clipboard.length === clipboard_processed.length) {
            // 选中粘贴对象
            var activeSelection = new fabric.ActiveSelection(clipboard_processed, {
                canvas: canvas
            });
            canvas.setActiveObject(activeSelection);
            // 再复制一次，重置其位置
            copyObj();
        }
        // 恢复操作记录
        recordingState = true;
        handleCanvasChange();
    }, 0);
    closeAllDialogs();
}
// 选择图片
function selectImage() {
    // 《 J S 读 文 件 三 部 曲 》（bushi）
    // 文件选择器：创建
    var fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.multiple = true;
    // 文件选择器：监听
    fileInput.onchange = function (e) {
        // 导入图片
        for (var i = 0; i < e.target.files.length; i++) {
            insertImage(e.target.files[i]);
        }
    };
    // 文件选择器：触发
    fileInput.click();
    closeAllDialogs();
}
// 导入图片
function insertImage(image) {
    // 避免在橡皮擦模式下导入图片
    if (currentPenMode === 'eraser') {
        setPenMode('pen');
    }
    // 文件读取器：创建
    var reader = new FileReader();
    // 文件读取器：监听
    reader.onload = function (event) {
        // 图片对象：创建
        var img = new Image();
        // 图片对象：监听
        img.onload = function () {
            // 自适应画布大小并居中
            if (img.width > img.height) {
                var scale = canvas.width / img.width / 2;
            } else {
                var scale = canvas.height / img.height / 2;
            }
            // 创建 Fabric 图片对象
            var imgObj = new fabric.Image(img, {
                scaleX: scale,
                scaleY: scale,
                left: canvas.width / 2 - img.width * scale / 2,
                top: canvas.height / 2 - img.height * scale / 2
            });
            // 加入画布
            canvas.add(imgObj);
            // 用一些奇怪的方法更新画布（）
            // 千万别用橡皮擦
            if (currentPenMode === 'eraser') {
                setPenMode('pen');
                selectAll();
                canvas.discardActiveObject();
                setPenMode('eraser');
            } else {
                selectAll();
                canvas.discardActiveObject();
            }
            // 选中图片
            var activeSelection = new fabric.ActiveSelection([imgObj], {
                canvas: canvas
            });
            canvas.setActiveObject(activeSelection);
        };
        // 图片对象：触发
        img.src = event.target.result;
    };
    // 文件读取器：触发
    reader.readAsDataURL(image);
}
// 反色
function invertColor() {
    var icon = document.querySelector('.icon-invertColor');
    document.body.classList.toggle('invert');
    icon.src = document.body.classList.contains('invert') ? '/static/icons/invert_colors.svg' : '/static/icons/invert_colors_off.svg';
    closeAllDialogs();
}
// 启用 / 禁用参考线
function toggleRefLine() {
    var overlay = document.querySelector('.refLine-overlay');
    var icon = document.querySelector('.icon-refLine');
    if (overlay.style.opacity == 1 || overlay.style.opacity.length === 0) {
        overlay.style.opacity = 0;
        icon.src = '/static/icons/grid_off.svg';
    } else {
        overlay.style.opacity = 1;
        icon.src = '/static/icons/grid_on.svg';
    }
    closeAllDialogs();
}
// 保存为 PNG
function saveAsPNG() {
    // 设置画布背景色
    canvas.backgroundColor = '#1e272c';
    var link = document.createElement('a');
    var date = new Date();
    link.download = `InkMirror-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}-${String(date.getHours()).padStart(2, '0')}${String(date.getMinutes()).padStart(2, '0')}${String(date.getSeconds()).padStart(2, '0')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    closeAllDialogs();
}
// 全屏 / 退出全屏
function toggleFullscreen() {
    var icon = document.querySelector('.icon-fullscreen');
    if (document.fullscreenElement) {
        document.exitFullscreen();
        icon.src = '/static/icons/fullscreen.svg';
    } else {
        document.documentElement.requestFullscreen();
        icon.src = '/static/icons/fullscreen_exit.svg';
    }
}
// 通用功能
// 调整画布大小
function resizeCanvas() {
    canvas.setHeight(document.body.clientHeight);
    canvas.setWidth(document.body.clientWidth);
}
// Hex 转 RGB
var convertedRGB = [];
function hexToRGB(hex) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    convertedRGB = [r, g, b];
    return [r, g, b];
}
// 全选
function selectAll() {
    const objects = canvas.getObjects();
    if (objects.length === 0) return;
    const activeSelection = new fabric.ActiveSelection(objects, {
        canvas: canvas
    });
    canvas.setActiveObject(activeSelection);
    canvas.requestRenderAll();
}
// 全部擦除
function clearAll(restorePenMode = true) {
    // 由于是逐个擦除，需要暂停操作记录
    recordingState = false;
    canvas.getObjects().forEach(function (obj) {
        canvas.remove(obj);
    });
    canvas.discardActiveObject();
    canvas.renderAll();
    if (restorePenMode) {
        setPenMode('pen');
    }
    setTimeout(() => {
        // 对整个擦除操作进行记录
        recordingState = true;
        handleCanvasChange();
    }, 0);
}
// 更新按钮禁用状态
function updateBtnAvai() {
    // 撤销与重做
    var undoButton = document.querySelector('.btn-undo');
    var redoButton = document.querySelector('.btn-redo');
    if (actionPointer <= 0) {
        undoButton.classList.add('toolbar-item-disabled');
    } else {
        undoButton.classList.remove('toolbar-item-disabled');
    }
    if (actionPointer >= actionStack.length - 1) {
        redoButton.classList.add('toolbar-item-disabled');
    } else {
        redoButton.classList.remove('toolbar-item-disabled');
    }
    // 多页面操作
    var prevButton = document.querySelector('.btn-prevPage');
    var nextIcon = document.querySelector('.icon-nextPage');
    if (currentPage <= 0) {
        prevButton.classList.add('toolbar-item-disabled');
    } else {
        prevButton.classList.remove('toolbar-item-disabled');
    }
    if (currentPage >= pages.length - 1) {
        nextIcon.src = "/static/icons/add.svg";
    } else {
        nextIcon.src = "/static/icons/keyboard_arrow_right.svg";
    }
}
// 获取选中对象
function getActiveObjects() {
    if (canvas.getActiveObject().getObjects) {
        return canvas.getActiveObject().getObjects();
    } else {
        return [canvas.getActiveObject()];
    }
}
// 生成 n 位随机代码
function generateRandomCode(n) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < n; i++) {
        code += chars[Math.floor(Math.random() * 36)];
    }
    return code;
}