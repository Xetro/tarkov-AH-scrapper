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

Categories := ["foregrips", "pistol_grips", "handguards", "tactical_combo_devices", "stocks_chassis"]      

for index, category in Categories
{

	JSONpath = ../data/wiki/%category%-data.json
	FileRead, JSONString, %JSONpath%

	parsedJSON := JSON.Load(JSONString)


	for k, v in parsedJSON
	{
		search := v.marketSearchName
		offset := (33*v.marketPositionOffset)
		y := (170+offset)
		MouseMove, 150, 120
		sleep 400
		Click 
		sleep 400
		Send, %search%
		If (search = "Pachmayr tactical rubber grip" or search = "Magazine")
		{
			sleep 4000
		}
		sleep 800
		MouseMove, 150, %y%
		Click 
		filename := v.filePath
		timestamp := A_now
		prePath := "../data/images/raw/"
		extension := ".png"
		fullPath = %prePath%%filename%--%timestamp%%extension%
		sleep 1200
		CaptureScreen(0,"true", fullPath)
		sleep 600

	}

}

return

#IfWinActive

^!+x::
ExitApp
return