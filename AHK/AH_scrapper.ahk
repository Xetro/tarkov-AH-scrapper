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

Categories := ["loot"]

FileRead, slow_search, slow_search.txt
sSlow_search := StrReplace(slow_search, "`r`n", ",")

for index, category in Categories
{

	JSONpath = ../data/wiki/%category%-data.json
	FileRead, JSONString, %JSONpath%

	parsedJSON := JSON.Load(JSONString)

	if (category = "armor_vests" or category = "armored_chest_rigs") {
		MouseMove, 240, 80
		sleep 200
		Click  
		sleep 200
	}

	for k, v in parsedJSON
	{
		search := v.marketSearchName
		offset := (33*v.marketPositionOffset)
		y := (170+offset) 
		MouseMove, 150, 120
		sleep 200
		Click  
		sleep 400
		Send, %search%
		if (category = "magazines") {
			if search in %sSlow_search%
				sleep 4000
		} else {
			if search contains %sSlow_search% 
				sleep 3000
		}
		sleep 1000
		MouseMove, 150, %y%
		sleep 400
		Click 
		filename := v.filePath
		timestamp := A_now
		prePath := "../data/images/raw/"
		extension := ".png"
		fullPath = %prePath%%filename%--%timestamp%%extension%
		sleep 1200
		CaptureScreen("50, 100, 1450, 1170", "true", fullPath)
	}

	if (category = "armor_vests" or category = "armored_chest_rigs") {
		MouseMove, 130, 80
		sleep 200
		Click
		sleep 200
	}
}

return

#IfWinActive

^!+x::
ExitApp
return