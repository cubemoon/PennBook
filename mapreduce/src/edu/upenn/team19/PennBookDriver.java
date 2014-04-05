package edu.upenn.team19;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.URI;
import org.apache.hadoop.conf.Configuration;
import org.apache.hadoop.fs.FileStatus;
import org.apache.hadoop.fs.FileSystem;
import org.apache.hadoop.fs.Path;
import org.apache.hadoop.io.Text;
import org.apache.hadoop.mapreduce.Job;
import org.apache.hadoop.mapreduce.lib.input.FileInputFormat;
import org.apache.hadoop.mapreduce.lib.output.FileOutputFormat;
import org.apache.hadoop.fs.FSDataInputStream;


public class PennBookDriver{
	public static void main(String[] args) throws Exception
	{
		// instantiate the jobs.
		Job init = new Job();
		Job iter = new Job();
//		Job diff1 = new Job();
//		Job diff2 = new Job();
		Job finish = new Job();


		// init stage.
		if (args[0].equals("init") || args[0].equals("composite")){
			System.out.println("Initiation started...");
			
			if (args[0].equals("init")){
				init.setNumReduceTasks(Integer.parseInt(args[3]));
			} else {
				init.setNumReduceTasks(Integer.parseInt(args[5]));
			}

			init.setMapperClass(InitMapper.class);
			init.setReducerClass(InitReducer.class);

			init.setMapOutputKeyClass(Text.class);
			init.setMapOutputValueClass(Text.class);
			init.setOutputKeyClass(Text.class);
			init.setOutputValueClass(Text.class);

			init.setJarByClass(PennBookDriver.class);
			
			FileInputFormat.addInputPath(init, new Path(args[1]));
			String output;
			if (args[0].equals("init")){
				output = args[2];
			} else {
				output = args[3];
			}
			FileOutputFormat.setOutputPath(init, new Path(output));

			if (args[0].equals("init")){
				System.exit(init.waitForCompletion(true) ? 0 : 1);
			} else {
				init.waitForCompletion(true);
				System.out.println("Initiation finished.");
			}
		}
		
		/*
		 * We leave the possibility for composite. We wrote diff1/2 methods as well.
		 * Because the data are to converge, so far we're manually setting the number
		 * of rounds as the fifth argument.
		 */
		
		if (args[0].equals("iter") || args[0].equals("composite")){
			System.out.println("Iteration started...");
			
			if (args[0].equals("iter")){
				iter.setNumReduceTasks(Integer.parseInt(args[3]));
			} else {
				iter.setNumReduceTasks(Integer.parseInt(args[5]));
			}
			
			iter.setJarByClass(PennBookDriver.class);

			iter.setMapperClass(IterMapper.class);
			iter.setReducerClass(IterReducer.class);

			iter.setMapOutputKeyClass(Text.class);
			iter.setMapOutputValueClass(Text.class);
			iter.setOutputKeyClass(Text.class);
			iter.setOutputValueClass(Text.class);
			
			String input;
    	String output;
    	
    	if (args[0].equals("composite")){
    		input = args[3];
    		output = args[4];
    	} else {
    		input = args[1];
    		output = args[2];
    	}
    	
    	FileInputFormat.addInputPath(iter, new Path(input));
    	FileOutputFormat.setOutputPath(iter, new Path(output));
    	
    	iter.waitForCompletion(true);
    	
    	if (args[0].equals("iter")){
    		
  			if (args.length == 6) {
  				int round = Integer.parseInt(args[4]);
  				System.out.println("Iteration round : " + round);
  				
  				if (round == 1) {
    				PennBookDriver.main(new String[] {"finish", output, args[5], args[3]});
    			} else {
    				round--;
    				deleteDirectory(input);
    				PennBookDriver.main(new String[] {"iter", output, input, args[3], round + "", args[5]});
    			}
    		} else {
    			System.exit(0);
    		}
    	} else {
    		int round = Integer.parseInt(args[6]);
    		if (round > 1) {
	    		deleteDirectory(input);
	    		round--;
	    		PennBookDriver.main(new String[] {"iter", output, input, args[5], round + "", args[2]});
    		} else {
    			PennBookDriver.main(new String[] {"finish", output, args[2], args[5]});
    		}
    	}
		}
		
		// Skipping the method diff. Continue with method finish.
		if (args[0].equals("finish") || args[0].equals("composite")) {
			System.out.println("Finishing started...");
			
			finish.setNumReduceTasks(Integer.parseInt(args[3]));
			
			finish.setJarByClass(PennBookDriver.class);
			
			finish.setMapperClass(FinishMapper.class);
	    finish.setReducerClass(FinishReducer.class);
			
			FileInputFormat.addInputPath(finish, new Path(args[1]));
			FileOutputFormat.setOutputPath(finish, new Path(args[2]));
			
			finish.setMapOutputKeyClass(Text.class);
			finish.setMapOutputValueClass(Text.class);
			finish.setOutputKeyClass(Text.class);
			finish.setOutputValueClass(Text.class);
			
			System.exit(finish.waitForCompletion(true) ? 0 : 1);
		}
	}

	// Given an output folder, returns the first double from the first part-r-00000 file
	static double readDiffResult(String path) throws Exception 
	{
		double diffnum = 0.0;
		Path diffpath = new Path(path);
		Configuration conf = new Configuration();
		FileSystem fs = FileSystem.get(URI.create(path),conf);

		if (fs.exists(diffpath)) {
			FileStatus[] ls = fs.listStatus(diffpath);
			for (FileStatus file : ls) {
				if (file.getPath().getName().startsWith("part-r-00000")) {
					FSDataInputStream diffin = fs.open(file.getPath());
					BufferedReader d = new BufferedReader(new InputStreamReader(diffin));
					String diffcontent = d.readLine();
					diffcontent = diffcontent.trim();
					diffnum = Double.parseDouble(diffcontent);
					d.close();
				}
			}
		}

		fs.close();
		return diffnum;
	}

	static void deleteDirectory(String path) throws Exception {
		Path todelete = new Path(path);
		Configuration conf = new Configuration();
		FileSystem fs = FileSystem.get(URI.create(path),conf);

		if (fs.exists(todelete)) 
			fs.delete(todelete, true);

		fs.close();
	}
}