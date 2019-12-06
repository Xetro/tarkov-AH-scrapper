#NoEnv  ; Recommended for performance and compatibility with future AutoHotkey releases.
; #Warn  ; Enable warnings to assist with detecting common errors.
SendMode Input ; Recommended for new scripts due to its superior speed and reliability.
SetWorkingDir %A_ScriptDir%  ; Ensures a consistent starting directory.

#include screen.ahk
#include JSON.ahk


#Persistent

; Written by LorenWard

#ifWinActive, ahk_exe EscapeFromTarkov.exe

*~F2::
JSONpath := "../data/wiki/thermal_vision_devices-data.json"
FileRead, JSONString, %JSONpath%

parsedJSON := JSON.Load(JSONString)


for k, v in parsedJSON
{
	offset := (33*v.marketPositionOffset)
	y := (170+offset)
	MouseMove, 150, 120
	sleep 200
	Click 
	sleep 500
	Send, % v.marketSearchName
	sleep 600
	MouseMove, 150, %y%
	Click 
	filename := v.filePath
	timestamp := A_now
	prePath := "../data/images/raw/"
	extension := ".png"
	fullPath = %prePath%%filename%_%timestamp%%extension%
	sleep 900
	CaptureScreen(0,"true", fullPath)
	sleep 400

}

return

#IfWinActive

^!+x::
ExitApp
return