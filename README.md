# 多功能影片處理工具

這個 repository 用來發布 SkillGodAK 的 Windows 版多功能影片處理工具 EXE，並提供自動更新用的 `version.json`。

## 最新版本

- 版本：`20260717-2`
- 檔案：`多功能影片處理工具20260717-2.exe`
- Release：[v20260717-2](https://github.com/SkillGodAk/multi-function-video-tool/releases/tag/v20260717-2)
- 下載：[20260717-2.exe](https://github.com/SkillGodAk/multi-function-video-tool/releases/download/v20260717-2/20260717-2.exe)

## 20260717-2 更新內容

- 新增手動「檢查更新」按鈕。
- 新增下載更新進度視窗。
- 新增「關於」視窗，可查看版本與發布頁。
- 重命名資料夾季數自動判斷支援 `Season 02`、`S2`、`第2季`、純數字資料夾。
- 重命名預覽新增略過原因統計。
- 重命名完成後會在資料夾內產生 `rename_report_日期.txt` 報告。
- 修正 `20260717-2` 這類同日小版本更新判斷，避免新版抓不到。

## 自動更新資訊

程式會讀取：

```text
https://raw.githubusercontent.com/SkillGodAk/multi-function-video-tool/master/version.json
```

當 `version` 高於目前程式版本時，會提示使用者下載並覆蓋更新。
