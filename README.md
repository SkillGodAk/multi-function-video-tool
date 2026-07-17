# 多功能影片處理工具

這個 repository 用來發布 SkillGodAK 的 Windows 版「多功能影片處理工具」EXE，以及提供程式啟動時自動檢查更新用的 `version.json`。

## 最新版本

- 版本：`20260717`
- 檔名：`多功能影片處理工具20260717.exe`
- Release：[v20260717](https://github.com/SkillGodAk/multi-function-video-tool/releases/tag/v20260717)

## 20260717 更新內容

- 修正 EXE 重命名分頁日誌/預覽偶發不顯示問題。
- 將重命名分頁背景執行緒的 UI 更新改回主執行緒處理。
- 新增啟動自動檢查更新功能，會讀取 GitHub 上的 `version.json`。
- 新增單一執行限制，重複開啟會顯示錯誤提示，不再開第二個主視窗。
- 補強智能命名：`作品名 2 - 10 [1080P]` 會穩定判斷為第 10 集。
- 保留並驗證 `25 4K`、`01v2`、`REPACK/PROPER`、`GM-Team` 括號集數等智能命名支援。

## 自動更新資料

程式會讀取：

```text
https://raw.githubusercontent.com/SkillGodAk/multi-function-video-tool/master/version.json
```

當 `version` 大於本機版本時，程式會提示是否下載新版並覆蓋目前 EXE。
