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
JSONpath := "../data/wiki/injectors-data.json"
FileRead, JSONString, %JSONpath%

parsedJSON := JSON.Load(JSONString)

for k, v in parsedJSON
{
	MouseMove, 150, 120
	sleep 200
	Click 
	sleep 500
	Send, % v.name
	sleep 400
	MouseMove, 150, 170
	Click 
	filename := v.filePath
	prePath := "../data/images/"
	extension := ".png"
	fullPath = %prePath%%filename%%extension%
	sleep 900
	CaptureScreen(0,"true", fullPath)
	sleep 400

}
; file := "../data/mods/mods-searchnames.txt"
; FileRead, LoadedText, %file%
; oSearchNames := StrSplit(LoadedText, "`n")

; file2 := "../data/mods/mods-filenames.txt"
; FileRead, LoadedText2, %file2%
; oFileNames := StrSplit(LoadedText2, "`n")

; Loop, % oSearchNames.MaxIndex()
; {
; 	MouseMove, 150, 120
; 	sleep 200
; 	Click 
; 	sleep 500
; 	Send, % oSearchNames[A_Index]
; 	sleep 400
; 	MouseMove, 150, 170
; 	Click 
; 	filename := oFileNames[A_index]
; 	prePath := "../images/mods/"
; 	extension := ".png"
; 	fullPath = %prePath%%filename%%extension%
; 	sleep 900
; 	CaptureScreen(0,"true", fullPath)
; 	sleep 400
; }

return

#IfWinActive

^!+x::
ExitApp
return