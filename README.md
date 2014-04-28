to concat all the jpgs into an avi

mencoder mf://*.jpg -mf w=480:h=640:fps=4:type=jpg -ovc lavc -lavcopts vcodec=mpeg4:mbd=2:trell -oac copy -o output.avi
