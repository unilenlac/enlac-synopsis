# Keep only significant part of numbering in pericopes. (Remove repeting prefix, e.g., RI.1.1, RI.1.2 -> 2)
import os, sys, getopt
import fnmatch
import string
import re

def renumber(lines, inputfname, outputfname):
    filecontent = ''
    oldNumber = ''

    for line in lines:
        res = re.search("([A-Z].+?\.[0-9]+\.)[0-9]+", line)

        if res is not None:
            number = res.group(1);
            if number == oldNumber :
                # remove it
                line = re.sub(number, '', line)
            else:
                oldNumber = number;

        filecontent += line

    outFile = open(outputfname, "w", encoding="utf-8")
    outFile.write(filecontent)
    outFile.close()

def main(argv):
    inputfile = ''
    outputfile = ''
    try:
        opts, args = getopt.getopt(sys.argv[1:], "hi:o:",["ifile=","ofile="])
    except getopt.GetoptError as err:
        print("Command line error.")
        # print help information and exit:
        print(str(err))  # will print something like "option -a not recognized"
        usage()
        sys.exit(2)
    for opt, arg in opts:
        if opt == '-h':
            print ('renumber.py -i <inputFile> -o <outputFile>')
            sys.exit()
        elif opt in ("-i", "--ifile"):
            inputfile = arg
        elif opt in ("-o", "--ofile"):
            outputfile = arg

    if (outputfile == ""): # write to same file
        outputfile = inputfile;

    if not(os.path.exists(inputfile)):
        print("Check input file.")
        sys.exit(2)
    if not(os.path.isfile(inputfile) and os.path.getsize(inputfile) > 0):
        print("Empty input file.")
        sys.exit(2)

    with open (inputfile, encoding='utf-8') as f:
        renumber(f.readlines(), inputfile, outputfile)
        # print(sum(1 for line in f));

if __name__ == "__main__":
    main(sys.argv[1:])
