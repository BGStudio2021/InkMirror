from flask import Flask, request
from flask_socketio import SocketIO, emit
import json
import os
import time
import sys
import socket
import configparser
from engineio.async_drivers import gevent

app = Flask(__name__)
app.config["SECRET_KEY"] = "secret!"
socketio = SocketIO(app)

# 从 config.ini 导入配置
config = configparser.ConfigParser()
config.read("config.ini")
server_port = config.getint("server", "port")
readonly = config.getboolean("app", "readonly")

# 获取本机局域网 IP
s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
s.connect(("8.8.8.8", 80))
server_ip = s.getsockname()[0]
server_ip_with_port = server_ip + ":" + str(server_port)
s.close()

# 初始化画布数据
canvas_data = ['{"version":"6.6.2","objects":[],"background":"#1e272c"}']

# 初始化在线成员
online_members = []

# 如果有参数，则使用参数中指定的画布数据文件，否则创建空画布
if len(sys.argv) > 1:
    data_file = sys.argv[1]
    with open(data_file, "r") as f:
        canvas_data = json.load(f).get("data")
else:
    # 创建画布数据文件，记录时间
    if not os.path.exists("./data"):
        os.mkdir("data")
    data_file = "./data/data-" + time.strftime("%Y%m%d_%H%M%S") + ".json"
    with open(data_file, "w") as f:
        json.dump({"data": canvas_data}, f)


# 客户端发送画布数据
@socketio.on("postCanvasData")
def postCanvasData(data):
    client_ip = request.remote_addr
    # 只读模式仅允许本机编辑
    if client_ip != server_ip and readonly:
        return "Access denied."
    client_code = data.get("client_code")  # 获取客户端代号
    page = data.get("page")  # 获取页码
    _canvas_data = data.get("data")  # 获取画布数据
    # 更新内存并写入文件
    canvas_data[page] = _canvas_data
    with open(data_file, "w") as f:
        json.dump({"data": canvas_data}, f)
    # 发送广播
    socketio.emit(
        "canvasData",
        {
            "page": page,
            "data": _canvas_data,
            "client_code": client_code,
            "timestamp": time.time(),
        },
    )
    # 打印日志
    print(
        "[" + time.strftime("%Y-%m-%d %H:%M:%S") + "] 客户端",
        client_ip,
        "编辑第 " + str(page + 1) + " 页。",
    )
    return "Success."


# 客户端新建页面
@socketio.on("newPage")
def newPage():
    client_ip = request.remote_addr
    if client_ip != server_ip and readonly:
        return "Access denied."
    # 新增页码并更新内存
    _data = '{"version":"6.6.2","objects":[],"background":"#1e272c"}'
    canvas_data.append(_data)
    # 写入文件
    with open(data_file, "w") as f:
        json.dump({"data": canvas_data}, f)
    # 发送广播
    socketio.emit(
        "canvasData",
        {
            "page": len(canvas_data) - 1,
            "data": _data,
            "client_code": "server",
            "timestamp": time.time(),
        },
    )
    # 打印日志
    print(
        "[" + time.strftime("%Y-%m-%d %H:%M:%S") + "] 客户端",
        client_ip,
        "创建第 " + str(len(canvas_data)) + " 页。",
    )
    return "Success."


# 客户端请求画布数据
@socketio.on("getCanvasData")
def getCanvasData():
    client_ip = request.remote_addr
    # 发送广播
    socketio.emit(
        "canvasData",
        {
            "data": json.dumps(canvas_data),
            "readonly": client_ip != server_ip and readonly,
            "client_code": "server",
            "timestamp": time.time(),
        },
    )
    # 打印日志
    print(
        "[" + time.strftime("%Y-%m-%d %H:%M:%S") + "] 客户端",
        client_ip,
        "获取画布数据。",
    )


# 客户端连接
@socketio.on("connect")
def handle_connect():
    client_ip = request.remote_addr
    # 更新在线成员
    if client_ip == server_ip:
        online_members.append("host-" + client_ip)
    else:
        online_members.append(client_ip)
    # 发送广播
    socketio.emit("onlineMembers", online_members)
    # 打印日志
    print("[" + time.strftime("%Y-%m-%d %H:%M:%S") + "] 客户端", client_ip, "已连接。")


# 客户端断开
@socketio.on("disconnect")
def handle_disconnect():
    client_ip = request.remote_addr
    # 更新在线成员
    if client_ip == server_ip:
        online_members.remove("host-" + client_ip)
    else:
        online_members.remove(client_ip)
    # 发送广播
    socketio.emit("onlineMembers", online_members)
    # 打印日志
    print(
        "[" + time.strftime("%Y-%m-%d %H:%M:%S") + "] 客户端", client_ip, "已断开连接。"
    )


@app.route("/favicon.ico")
def favicon():
    return app.send_static_file("favicon.ico")


@app.route("/")
def index():
    return app.send_static_file("index.html")


if __name__ == "__main__":
    # 输出时间、IP
    print(
        "[" + time.strftime("%Y-%m-%d %H:%M:%S") + "] InkMirror 服务已启动，访问",
        "http://" + server_ip_with_port + "/",
        "开始使用。",
    )
    socketio.run(app, host="0.0.0.0", port=server_port, debug=False)
